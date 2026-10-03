import { format, differenceInCalendarDays, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';

export type MoonPhase =
  | 'new'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'waxing-gibbous'
  | 'full'
  | 'waning-gibbous'
  | 'last-quarter'
  | 'waning-crescent';

export function formatDate(timestamp: number, formatStr: string = 'dd/MM/yyyy'): string {
  return format(new Date(timestamp), formatStr, { locale: vi });
}

export function formatDateTime(timestamp: number): string {
  return format(new Date(timestamp), 'HH:mm - dd/MM/yyyy', { locale: vi });
}

export function getDaysRemaining(unlockAt: number): number {
  const target = new Date(unlockAt);
  const now = new Date();
  if (isPast(target)) return 0;
  return Math.max(0, differenceInCalendarDays(target, now));
}

export function isUnlockable(unlockAt: number): boolean {
  return Date.now() >= unlockAt;
}

/**
 * Truncated Meeus lunar phase calculation.
 * Deterministic without external APIs.
 */
export function getMoonPhase(timestamp: number): MoonPhase {
  const KNOWN_NEW_MOON = 947182440000; // Jan 6, 2000, 18:14 UTC
  const LUNAR_CYCLE = 29.53058867 * 86400000;
  let phase = ((timestamp - KNOWN_NEW_MOON) % LUNAR_CYCLE) / LUNAR_CYCLE;
  if (phase < 0) phase += 1;

  if (phase < 0.03125 || phase >= 0.96875) return 'new';
  if (phase < 0.21875) return 'waxing-crescent';
  if (phase < 0.28125) return 'first-quarter';
  if (phase < 0.46875) return 'waxing-gibbous';
  if (phase < 0.53125) return 'full';
  if (phase < 0.71875) return 'waning-gibbous';
  if (phase < 0.78125) return 'last-quarter';
  return 'waning-crescent';
}

export function getMoonGlyph(phase: MoonPhase): string {
  switch (phase) {
    case 'new':
      return '🌑';
    case 'waxing-crescent':
      return '🌒';
    case 'first-quarter':
      return '🌓';
    case 'waxing-gibbous':
      return '🌔';
    case 'full':
      return '🌕';
    case 'waning-gibbous':
      return '🌖';
    case 'last-quarter':
      return '🌗';
    case 'waning-crescent':
      return '🌘';
  }
}

/**
 * Poetic Vietnamese hour label based on local hour:
 * 00:00–04:59 → đêm khuya
 * 05:00–07:59 → sáng sớm
 * 08:00–11:59 → buổi sáng
 * 12:00–13:59 → buổi trưa
 * 14:00–17:59 → buổi chiều
 * 18:00–21:59 → buổi tối
 * 22:00–23:59 → đêm muộn
 */
export function getPoeticHourLabel(date: Date): string {
  const h = date.getHours();
  if (h >= 0 && h < 5) return 'đêm khuya';
  if (h >= 5 && h < 8) return 'sáng sớm';
  if (h >= 8 && h < 12) return 'buổi sáng';
  if (h >= 12 && h < 14) return 'buổi trưa';
  if (h >= 14 && h < 18) return 'buổi chiều';
  if (h >= 18 && h < 22) return 'buổi tối';
  return 'đêm muộn';
}

export function formatWriteTime(timestamp: number): string {
  const d = new Date(timestamp);
  const time = format(d, 'HH:mm');
  const label = getPoeticHourLabel(d);
  return `${time} ${label}`;
}

export function getNoteTimeMetadata(timestamp: number) {
  const phase = getMoonPhase(timestamp);
  const glyph = getMoonGlyph(phase);
  const timeStr = formatWriteTime(timestamp);
  return {
    phase,
    glyph,
    timeStr,
  };
}
