import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { addMonths } from 'date-fns';
import { nanoid } from 'nanoid';

import { useWriteStore } from '@/store/useWriteStore';
import { storage } from '@/lib/storage';
import { Note } from '@/types/note';
import { step2ContentSchema, wishSchema } from '@/lib/schemas';
import { DEFAULT_EASING, PromptOption } from '@/lib/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

import { ProgressDots } from '@/components/ui/ProgressDots';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

import { Step1Prompt } from './Step1Prompt';
import { Step2Content } from './Step2Content';
import { Step3Unlock } from './Step3Unlock';

export function Write() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  // Zustand persistent store
  const {
    step,
    content,
    promptId,
    promptChosen,
    paperTheme,
    stickerIds,
    unlockAt,
    setStep,
    setContent,
    setPromptId,
    setPromptChosen,
    setPaperTheme,
    setStickerIds,
    setUnlockAt,
    reset,
  } = useWriteStore();

  // Animation direction: +1 = forward (slide left), -1 = backward (slide right)
  const [direction, setDirection] = useState<number>(1);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  // Ensure default unlock date (1 month from now) if null
  useEffect(() => {
    if (!unlockAt) {
      setUnlockAt(addMonths(new Date(), 1).getTime());
    }
  }, [unlockAt, setUnlockAt]);

  // Support direct step testing via query param (e.g. /viet?step=2)
  useEffect(() => {
    const qStep = searchParams.get('step');
    if (qStep === '2') {
      setPromptChosen(true);
      if (!content) setContent('Mình muốn đến Đà Lạt và ở đó mãi mãi…');
      setStep(2);
    }
  }, [searchParams, content, setPromptChosen, setContent, setStep]);

  // Route guards
  useEffect(() => {
    // If on Step 2 without a chosen prompt, redirect to Step 1
    if (step === 2 && !promptChosen) {
      setDirection(-1);
      setStep(1);
    }
    // If on Step 3 with invalid content (< 5 chars), redirect to Step 2
    if (step === 3 && content.trim().length < 5) {
      setDirection(-1);
      setStep(2);
    }
  }, [step, promptChosen, content, setStep]);

  // Handle Step 1 prompt selection
  const handleSelectPrompt = (option: PromptOption) => {
    setPromptChosen(true);
    if (option.id === 'custom') {
      setPromptId(null);
      setContent('');
    } else {
      setPromptId(option.id);
      setContent(option.template);
    }
    setDirection(1);
    setStep(2);
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

    setDirection(1);
    setStep(3);
  };

  // Step 3: Seal note
  const handleSealNote = () => {
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
    };

    // Save to localStorage
    storage.addNote(newNote);

    // Reset store
    reset();

    // Navigate to completion
    navigate('/viet/xong');
  };

  // Back button
  const handleBack = () => {
    if (step === 2) {
      setDirection(-1);
      setStep(1);
    } else if (step === 3) {
      setDirection(-1);
      setStep(2);
    } else {
      navigate('/');
    }
  };

  // Restart / Reset
  const handleRestart = () => {
    reset();
    setDirection(-1);
    setStep(1);
  };

  // Animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: prefersReducedMotion ? 0 : dir > 0 ? 32 : -32,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: prefersReducedMotion ? 0 : dir > 0 ? -32 : 32,
      opacity: 0,
    }),
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between pb-24 sm:pb-8">
      {/* Top Header Controls: Back Button, ProgressDots, Restart Button */}
      <div className="w-full max-w-[640px] mx-auto flex items-center justify-between py-2 mb-2">
        <div className="w-10 flex items-center justify-start">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-soft transition-colors cursor-pointer"
              title="Quay lại"
              aria-label="Quay lại bước trước"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="p-2 -ml-2 rounded-full text-text-muted hover:text-text-secondary hover:bg-bg-soft transition-colors cursor-pointer"
              title="Về trang chủ"
              aria-label="Về trang chủ"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* ProgressDots centered */}
        <ProgressDots
          currentStep={step}
          onStepClick={(targetStep) => {
            if (targetStep < step) {
              setDirection(-1);
              setStep(targetStep);
            }
          }}
        />

        {/* Restart Button on the right */}
        <div className="w-10 flex items-center justify-end">
          {step > 1 && (
            <button
              type="button"
              onClick={handleRestart}
              className="p-2 -mr-2 rounded-full text-text-muted hover:text-text-secondary hover:bg-bg-soft transition-colors cursor-pointer"
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
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: 0.32,
              ease: DEFAULT_EASING,
            }}
            className="w-full flex-1 flex flex-col items-center"
          >
            {step === 1 && (
              <Step1Prompt
                selectedPromptId={promptId || (promptChosen ? 'custom' : null)}
                onSelectPrompt={handleSelectPrompt}
              />
            )}

            {step === 2 && (
              <Step2Content
                content={content}
                onContentChange={setContent}
                paperTheme={paperTheme}
                onPaperThemeChange={setPaperTheme}
                stickerIds={stickerIds}
                onStickerIdsChange={setStickerIds}
                onStickerMaxReached={() => showToast('Chỉ dán tối đa 3 sticker nha 🥺')}
              />
            )}

            {step === 3 && (
              <Step3Unlock
                unlockAt={unlockAt || addMonths(new Date(), 1).getTime()}
                onUnlockAtChange={setUnlockAt}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA Actions */}
      {step > 1 && (
        <div className="fixed sm:static bottom-0 inset-x-0 z-30 p-4 sm:p-0 sm:pt-6 sm:mt-6 bg-bg-deep/90 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-border-soft/50 sm:border-none">
          <div className="w-full max-w-[420px] mx-auto">
            {step === 2 && (
              <Button
                variant="pill"
                onClick={handleStep2Next}
                className="w-full py-4 text-base font-semibold"
              >
                <span>Tiếp →</span>
              </Button>
            )}

            {step === 3 && (
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
