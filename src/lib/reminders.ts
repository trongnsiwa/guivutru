import { supabase } from './supabase';

export const REMINDERS_PREF_KEY = 'gvt_email_reminders_enabled';

export function getLocalEmailRemindersEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(REMINDERS_PREF_KEY);
  return val !== 'false';
}

export function setLocalEmailRemindersEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REMINDERS_PREF_KEY, enabled ? 'true' : 'false');
}

/**
 * Synchronizes the email reminder preference to Supabase user_preferences
 * if authenticated, or falls back to localStorage.
 */
export async function updateEmailReminderPreference(
  enabled: boolean,
  userId?: string | null
): Promise<{ success: boolean; enabled: boolean }> {
  setLocalEmailRemindersEnabled(enabled);

  if (userId && supabase) {
    try {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          email_reminders_enabled: enabled,
          updated_at: new Date().toISOString(),
        });
    } catch (err) {
      console.warn('Failed to sync user_preferences to Supabase:', err);
    }
  }

  return { success: true, enabled };
}
