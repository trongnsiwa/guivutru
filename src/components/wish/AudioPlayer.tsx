import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Lock, Volume2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getLocalAudio, getAudioSignedUrl } from '@/lib/audio';

export interface AudioPlayerProps {
  noteId: string;
  isSealed: boolean;
  audioPath?: string | null;
  className?: string;
}

export function AudioPlayer({
  noteId,
  isSealed,
  audioPath,
  className,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Fetch or prepare audio source when note is opened/unlocked
  const resolveAudioUrl = useCallback(async (): Promise<string | null> => {
    // 1. Try local IndexedDB first
    try {
      const local = await getLocalAudio(noteId);
      if (local?.blob) {
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        const objUrl = URL.createObjectURL(local.blob);
        blobUrlRef.current = objUrl;
        return objUrl;
      }
    } catch {
      // IndexedDB lookup failed, fallback to cloud
    }

    // 2. Fall back to Supabase signed URL if available
    if (audioPath) {
      const signedUrl = await getAudioSignedUrl(audioPath, 60);
      return signedUrl;
    }

    return null;
  }, [noteId, audioPath]);

  // Clean up blob URL
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleTogglePlay = async () => {
    if (isSealed) return;

    if (!audioUrl) {
      setIsLoading(true);
      const url = await resolveAudioUrl();
      setIsLoading(false);
      if (!url) return;
      setAudioUrl(url);

      if (!audioRef.current) {
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onloadedmetadata = () => {
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            setDuration(Math.floor(audio.duration));
          }
        };

        audio.ontimeupdate = () => {
          setCurrentTime(Math.floor(audio.currentTime));
        };

        audio.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };
      } else {
        audioRef.current.src = url;
      }
    }

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        // If expired signed URL, refetch silently and retry
        const freshUrl = await resolveAudioUrl();
        if (freshUrl && audioRef.current) {
          audioRef.current.src = freshUrl;
          setAudioUrl(freshUrl);
          await audioRef.current.play();
          setIsPlaying(true);
        }
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSealed || !audioRef.current) return;
    const seekTo = Number(e.target.value);
    audioRef.current.currentTime = seekTo;
    setCurrentTime(seekTo);
  };

  const formatSeconds = (sec: number) => {
    const s = Math.floor(sec);
    const m = Math.floor(s / 60);
    const remain = s % 60;
    return `${m < 10 ? `0${m}` : m}:${remain < 10 ? `0${remain}` : remain}`;
  };

  if (isSealed) {
    return (
      <div
        className={cn(
          'w-full max-w-[420px] mx-auto flex items-center justify-between px-4 py-2.5 rounded-2xl',
          'border border-border-soft/60 bg-bg-soft/40 backdrop-blur-sm select-none',
          className
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-bg-deep/60 border border-border-soft/60 flex items-center justify-center text-text-muted">
            <Lock className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-xs font-medium text-text-muted">
              Bản ghi âm đã niêm phong 🔒
            </span>
            <span className="font-sans text-[11px] text-text-muted/70">
              Sẽ mở cùng điều ước vào ngày hẹn
            </span>
          </div>
        </div>
        <div className="h-2 w-16 rounded-full bg-border-soft/20" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full max-w-[420px] mx-auto flex items-center gap-3 px-4 py-2.5 rounded-2xl',
        'border border-lavender/30 bg-bg-soft/80 backdrop-blur-md shadow-sm',
        className
      )}
    >
      <button
        type="button"
        onClick={handleTogglePlay}
        disabled={isLoading}
        className="h-9 w-9 rounded-full bg-lavender/20 border border-lavender/40 text-lavender hover:bg-lavender/30 flex items-center justify-center transition-colors focus-visible:outline-none shrink-0"
        title={isPlaying ? 'Tạm dừng' : 'Nghe điều ước'}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="h-4 w-4 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary">
          <span className="flex items-center gap-1 font-sans font-medium text-text-primary text-xs">
            <Volume2 className="h-3 w-3 text-lavender" />
            <span>Giọng nói gửi vũ trụ</span>
          </span>
          <span>
            {formatSeconds(currentTime)} / {formatSeconds(duration || 30)}
          </span>
        </div>

        {/* Seek track */}
        <input
          type="range"
          min={0}
          max={duration || 30}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-border-soft/40 rounded-lg appearance-none cursor-pointer accent-lavender"
        />
      </div>
    </div>
  );
}
