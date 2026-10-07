import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { addMonths } from 'date-fns';
import { nanoid } from 'nanoid';

import { useShallow } from 'zustand/shallow';
import { useWriteStore } from '@/store/useWriteStore';
import { useNotes } from '@/hooks/useNotes';
import { Note } from '@/types/note';
import { step2ContentSchema, wishSchema } from '@/lib/schemas';
import { PromptOption, STORAGE_KEYS } from '@/lib/constants';

import { ProgressDots } from '@/components/ui/ProgressDots';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

import { Step1Prompt } from './Step1Prompt';
import { Step2Content } from './Step2Content';
import { Step3Unlock } from './Step3Unlock';
import { useAuth } from '@/hooks/useAuth';
import { validateContentModeration, BAD_WORD_REJECTION } from '@/lib/moderation';
import { checkPublicRateLimit, RATE_LIMIT_REJECTION } from '@/lib/sky';
import { getOrCreateUserPseudonym } from '@/lib/pseudonym';

export function Write() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Zustand persistent store with shallow selector
  const {
    step,
    content,
    promptId,
    promptChosen,
    paperTheme,
    stickerIds,
    unlockAt,
    visibility,
    sessionActive,
    setStep,
    setContent,
    setPromptId,
    setPromptChosen,
    setPaperTheme,
    setStickerIds,
    setUnlockAt,
    setVisibility,
    setSessionActive,
    reset,
  } = useWriteStore(
    useShallow((s) => ({
      step: s.step,
      content: s.content,
      promptId: s.promptId,
      promptChosen: s.promptChosen,
      paperTheme: s.paperTheme,
      stickerIds: s.stickerIds,
      unlockAt: s.unlockAt,
      visibility: s.visibility,
      sessionActive: s.sessionActive,
      setStep: s.setStep,
      setContent: s.setContent,
      setPromptId: s.setPromptId,
      setPromptChosen: s.setPromptChosen,
      setPaperTheme: s.setPaperTheme,
      setStickerIds: s.setStickerIds,
      setUnlockAt: s.setUnlockAt,
      setVisibility: s.setVisibility,
      setSessionActive: s.setSessionActive,
      reset: s.reset,
    }))
  );

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const queryStep = searchParams.get('step');
  const currentStep = queryStep === '2' ? 2 : queryStep === '3' ? 3 : step;

  // Mount detection logic:
  // If sessionActive is false OR store has no meaningful content, reset to full defaults only if dirty.
  useEffect(() => {
    if (queryStep) return;
    const hasMeaningfulContent = Boolean(content.trim() || promptId || promptChosen);
    if (!sessionActive || !hasMeaningfulContent) {
      if (sessionActive || content || promptId || promptChosen || step !== 1) {
        reset();
      }
    }
  }, []); // Run on mount only

  // Route guards
  useEffect(() => {
    if (queryStep) return;
    // If on Step 2 without a chosen prompt, redirect to Step 1
    if (step === 2 && !promptChosen) {
      setStep(1);
    } else if (step === 3 && content.trim().length < 5) {
      // If on Step 3 with invalid content (< 5 chars), redirect to Step 2
      setStep(2);
    }
  }, [queryStep, step, promptChosen, content, setStep]);

  // Support direct step testing via query param (e.g. /viet?step=2)
  useEffect(() => {
    if (queryStep === '2' && (step !== 2 || !sessionActive || !promptChosen)) {
      setSessionActive(true);
      setPromptChosen(true);
      if (!content) setContent('');
      setStep(2);
    }
  }, [queryStep, step, content, sessionActive, promptChosen, setSessionActive, setPromptChosen, setContent, setStep]);

  // Handle Step 1 prompt selection
  const handleSelectPrompt = (option: PromptOption) => {
    setSessionActive(true);
    setPromptChosen(true);
    if (option.id === 'custom') {
      setPromptId(null);
      setContent('');
    } else {
      setPromptId(option.id);
      setContent(option.template);
    }
    setStep(2);
  };

  // Step 2 content change (sets sessionActive=true on first keystroke)
  const handleContentChange = (val: string) => {
    if (!sessionActive) {
      setSessionActive(true);
    }
    setContent(val);
  };

  // Step 2 -> Step 3
  const handleStep2Next = () => {
    const result = step2ContentSchema.safeParse({
      content,
      paperTheme,
      stickerIds,
    });

    if (!result.success) {
      const firstError = result.error.errors[0]?.message || 'Nội dung chưa hợp lệ';
      showToast(firstError);
      return;
    }

    setStep(3);
  };

  // Step 3: Seal note
  const handleSealNote = async () => {
    // Haptic feedback (A5)
    try {
      navigator.vibrate?.(10);
    } catch {
      // safe fallback
    }

    const activeUnlockAt = unlockAt || addMonths(new Date(), 1).getTime();

    const result = wishSchema.safeParse({
      content,
      paperTheme,
      stickerIds,
      unlockAt: activeUnlockAt,
    });

    if (!result.success) {
      const firstError = result.error.errors[0]?.message || 'Thông tin chưa hợp lệ';
      showToast(firstError);
      return;
    }

    // Public note checks (§3.1, §3.4, §3.5, §3.7)
    let assignedPseudonym: string | undefined;
    if (visibility === 'public') {
      // Layer 1: Pre-filter bad words (§3.4)
      const moderationResult = await validateContentModeration(content);
      if (!moderationResult.allowed) {
        showToast(moderationResult.message || BAD_WORD_REJECTION);
        return;
      }

      // Acceptance: Publishing requires login (§3.7)
      const currentUser = useAuth.getState().user;
      if (!currentUser) {
        showToast('Đăng nhập để chia sẻ lên bầu trời nha 🌙');
        useAuth.getState().openLoginModal();
        return;
      }

      // Layer 3.5: Rate limiting check (1/day, 5/week)
      const rateCheck = await checkPublicRateLimit(currentUser.id);
      if (!rateCheck.allowed) {
        showToast(rateCheck.message || RATE_LIMIT_REJECTION);
        return;
      }

      // Stable pseudonym per user (§3.3)
      assignedPseudonym = await getOrCreateUserPseudonym(currentUser.id);
    }

    // Create note object
    const newNote: Note = {
      id: nanoid(12),
      content: content.trim(),
      promptId,
      paperTheme,
      stickerIds,
      unlockAt: activeUnlockAt,
      status: 'sealed',
      createdAt: Date.now(),
      openedAt: null,
      visibility,
      pseudonym: assignedPseudonym,
    };

    // Save to localStorage and sync if authenticated
    try {
      await useNotes.getState().addNote(newNote);
    } catch {
      showToast('Không lưu được rồi, thử lại nha 🥲');
      return;
    }

    // Save note to sessionStorage for /viet/xong (Option A)
    sessionStorage.setItem(STORAGE_KEYS.LAST_SEALED, JSON.stringify(newNote));

    // Reset store before navigating to /viet/xong
    reset();

    // Navigate to completion
    navigate('/viet/xong');
  };

  // Back button
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    } else {
      navigate('/');
    }
  };

  // Restart / Reset
  const handleRestart = () => {
    reset();
    setStep(1);
  };

  // Animation variants: within-step transitions are opacity-only, 150ms
  const stepVariants = {
    enter: {
      opacity: 0,
    },
    center: {
      opacity: 1,
    },
    exit: {
      opacity: 0,
    },
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between pb-24 sm:pb-8">
      {/* Top Header Controls: Back Button, ProgressDots, Restart Button */}
      <div className="w-full max-w-[640px] mx-auto flex items-center justify-between py-2 mb-2">
        <div className="w-10 flex items-center justify-start">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-soft transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender"
              title="Quay lại"
              aria-label="Quay lại bước trước"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="p-2 -ml-2 rounded-full text-text-muted hover:text-text-secondary hover:bg-bg-soft transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender"
              title="Về trang chủ"
              aria-label="Về trang chủ"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* ProgressDots centered */}
        <ProgressDots
          currentStep={currentStep}
          onStepClick={(targetStep) => {
            if (targetStep < currentStep) {
              setStep(targetStep);
            }
          }}
        />

        {/* Restart Button on the right */}
        <div className="w-10 flex items-center justify-end">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleRestart}
              className="p-2 -mr-2 rounded-full text-text-muted hover:text-text-secondary hover:bg-bg-soft transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender"
              title="Bắt đầu lại"
              aria-label="Bắt đầu lại từ đầu"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Step Content with animated transitions */}
      <div className="w-full max-w-[640px] mx-auto flex-1 flex flex-col justify-start overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep}
            variants={stepVariants}
            initial={false}
            animate="center"
            exit="exit"
            transition={{
              duration: 0.15,
              ease: 'easeOut',
            }}
            className="w-full flex-1 flex flex-col items-center"
          >
            {currentStep === 1 && (
              <Step1Prompt
                selectedPromptId={promptId || (promptChosen ? 'custom' : null)}
                onSelectPrompt={handleSelectPrompt}
              />
            )}

            {currentStep === 2 && (
              <Step2Content
                content={content}
                onContentChange={handleContentChange}
                paperTheme={paperTheme}
                onPaperThemeChange={setPaperTheme}
                stickerIds={stickerIds}
                onStickerIdsChange={setStickerIds}
                onStickerMaxReached={() => showToast('Chỉ dán tối đa 3 sticker nha 🥺')}
              />
            )}

            {currentStep === 3 && (
              <Step3Unlock
                unlockAt={unlockAt || addMonths(new Date(), 1).getTime()}
                onUnlockAtChange={setUnlockAt}
                visibility={visibility}
                onVisibilityChange={setVisibility}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA Actions */}
      {currentStep > 1 && (
        <div className="fixed sm:static bottom-0 inset-x-0 z-30 p-4 sm:p-0 sm:pt-6 sm:mt-6 bg-bg-deep/90 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-border-soft/50 sm:border-none">
          <div className="w-full max-w-[420px] mx-auto">
            {currentStep === 2 && (
              <Button
                variant="pill"
                onClick={handleStep2Next}
                className="w-full py-4 text-base font-semibold"
              >
                <span>Tiếp →</span>
              </Button>
            )}

            {currentStep === 3 && (
              <Button
                variant="pill"
                onClick={handleSealNote}
                className="w-full py-4 text-base font-semibold"
              >
                <span>Niêm phong 🔒</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        duration={2500}
      />
    </div>
  );
}

export default Write;
