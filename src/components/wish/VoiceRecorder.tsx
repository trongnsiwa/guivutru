import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getSupportedAudioMimeType } from '@/lib/audio';

export interface VoiceRecorderProps {
  hasAudio: boolean;
  audioBlob: Blob | null;
  audioDuration: number;
  onAudioChange: (blob: Blob, duration: number) => void;
  onAudioDelete: () => void;
}

type RecorderStatus = 'idle' | 'recording' | 'preview';

const MAX_RECORDING_SECONDS = 30;

export function VoiceRecorder({
  hasAudio,
  audioBlob,
  audioDuration,
  onAudioChange,
  onAudioDelete,
}: VoiceRecorderProps) {
  const [status, setStatus] = useState<RecorderStatus>(hasAudio ? 'preview' : 'idle');
  const [elapsed, setElapsed] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Sync state if audio cleared externally
  useEffect(() => {
    if (!hasAudio && status === 'preview') {
      setStatus('idle');
      setElapsed(0);
      setIsPlaying(false);
    }
  }, [hasAudio, status]);

  // Object URL cleanup
  useEffect(() => {
    if (audioBlob) {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = URL.createObjectURL(audioBlob);
    } else if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, [audioBlob]);

  // Clean up timers & recorder on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);

  const stopRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMimeType();
      const options = mimeType ? { mimeType } : undefined;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm',
        });
        const durationSec = Math.min(
          MAX_RECORDING_SECONDS,
          Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
        );
        onAudioChange(finalBlob, durationSec);
        setStatus('preview');
        setElapsed(durationSec);
      };

      mediaRecorder.start(250); // Slice data every 250ms
      startTimeRef.current = Date.now();
      setStatus('recording');
      setElapsed(0);

      // Auto-stop at exactly 30s
      timerIntervalRef.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(seconds);
        if (seconds >= MAX_RECORDING_SECONDS) {
          stopRecording();
        }
      }, 100);
    } catch (err) {
      console.warn('[VoiceRecorder] getUserMedia failed:', err);
    }
  };

  const handleTogglePlayback = () => {
    if (!audioUrlRef.current) return;

    if (!audioElementRef.current) {
      const audio = new Audio(audioUrlRef.current);
      audioElementRef.current = audio;

      audio.ontimeupdate = () => {
        setPlaybackTime(Math.floor(audio.currentTime));
      };

      audio.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      };
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => console.warn('Play error:', e));
    }
  };

  const handleDelete = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setIsPlaying(false);
    setStatus('idle');
    setElapsed(0);
    setPlaybackTime(0);
    onAudioDelete();
  };

  const remainingSeconds = Math.max(0, MAX_RECORDING_SECONDS - elapsed);

  return (
    <div className="w-full flex items-center justify-between p-3 rounded-2xl border border-border-soft bg-bg-soft/70 backdrop-blur-sm">
      {status === 'idle' && (
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm select-none">🎙️</span>
            <div className="flex flex-col">
              <span className="font-sans text-xs font-semibold text-text-primary">
                Ghi âm giọng nói
              </span>
              <span className="font-sans text-[11px] text-text-muted">
                Tối đa 30 giây gửi vào tương lai
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={startRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans text-lavender hover:bg-lavender/10 border border-lavender/30"
          >
            <Mic className="h-3.5 w-3.5" />
            <span>Ghi âm</span>
          </Button>
        </div>
      )}

      {status === 'recording' && (
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink"></span>
            </span>
            <div className="flex items-center gap-1 font-mono text-xs text-pink font-semibold">
              <span>00:{elapsed < 10 ? `0${elapsed}` : elapsed}</span>
              <span className="text-text-muted text-[10px]">/ 00:30</span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={stopRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans bg-pink/20 hover:bg-pink/30 text-pink border border-pink/40"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            <span>Dừng ({remainingSeconds}s)</span>
          </Button>
        </div>
      )}

      {status === 'preview' && (
        <div className="w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlayback}
              className="h-8 w-8 rounded-full bg-lavender/20 border border-lavender/40 text-lavender hover:bg-lavender/30 flex items-center justify-center transition-colors focus-visible:outline-none"
              title={isPlaying ? 'Tạm dừng' : 'Nghe thử'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </button>
            <div className="flex flex-col">
              <span className="font-sans text-xs font-medium text-text-primary">
                {isPlaying ? 'Đang phát...' : 'Bản thu giọng nói'}
              </span>
              <span className="font-mono text-[10px] text-text-muted">
                {isPlaying
                  ? `00:${playbackTime < 10 ? `0${playbackTime}` : playbackTime}`
                  : `00:${audioDuration || elapsed}`}
                {' / '}
                00:{audioDuration || elapsed}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                handleDelete();
                startRecording();
              }}
              className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
              title="Ghi âm lại"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 rounded-full text-text-muted hover:text-pink hover:bg-pink/10 transition-colors"
              title="Xoá bản thu"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
