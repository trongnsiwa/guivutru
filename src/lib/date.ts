import { format, differenceInCalendarDays, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';

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
