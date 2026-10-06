import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getLocalOnlyNotes, purgeCloudNotesFromLocal, syncNotesWithCloud } from '@/lib/sync';
import { useNotes } from './useNotes';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  showLoginModal: boolean;
  showSyncPrompt: boolean;
  localNotesCount: number;
  authError: string | null;
  authSuccess: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  dismissSyncPrompt: () => void;
  confirmSyncLocalNotes: (upload: boolean) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  initAuth: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  showLoginModal: false,
  showSyncPrompt: false,
  localNotesCount: 0,
  authError: null,
  authSuccess: false,

  openLoginModal: () => {
    set({ showLoginModal: true, authError: null, authSuccess: false });
  },

  closeLoginModal: () => {
    set({ showLoginModal: false, authError: null, authSuccess: false });
  },

  dismissSyncPrompt: () => {
    set({ showSyncPrompt: false });
    // Still sync existing cloud notes down without uploading local notes
    const { user } = get();
    if (user) {
      syncNotesWithCloud(user.id, { uploadLocalNotes: false }).then(() => {
        useNotes.getState().loadNotes();
      });
    }
  },

  confirmSyncLocalNotes: async (upload: boolean) => {
    const { user } = get();
    set({ showSyncPrompt: false });
    if (user) {
      await syncNotesWithCloud(user.id, { uploadLocalNotes: upload });
      useNotes.getState().loadNotes();
    }
  },

  signInWithMagicLink: async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: 'Chưa cấu hình dịch vụ đám mây (Supabase).',
      };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        // Vietnamese error copy per §2.2
        const message = 'Link hết hạn rồi, gửi lại nha';
        set({ authError: message, authSuccess: false });
        return { success: false, message };
      }

      // Vietnamese sent copy per §2.2
      const message = 'Mở email để đăng nhập nha 📬';
      set({ authSuccess: true, authError: null });
      return { success: true, message };
    } catch {
      const message = 'Link hết hạn rồi, gửi lại nha';
      set({ authError: message, authSuccess: false });
      return { success: false, message };
    }
  },

  signOut: async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[Auth] Sign out error:', err);
      }
    }

    // Per §2.5: On logout, cloud notes are removed from localStorage; local-only notes stay.
    purgeCloudNotesFromLocal();
    useNotes.getState().loadNotes();

    set({
      user: null,
      session: null,
      showLoginModal: false,
      showSyncPrompt: false,
    });
  },

  initAuth: () => {
    if (!isSupabaseConfigured || !supabase) {
      set({ loading: false });
      return;
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      set({ user, session, loading: false });

      if (user) {
        const localOnly = getLocalOnlyNotes();
        if (localOnly.length > 0) {
          // Rule: Prompt user before uploading local notes. Never upload silently!
          set({ showSyncPrompt: true, localNotesCount: localOnly.length });
        } else {
          // No local-only notes, sync server notes directly
          syncNotesWithCloud(user.id, { uploadLocalNotes: false }).then(() => {
            useNotes.getState().loadNotes();
          });
        }
      }
    });

    // Listen to auth changes (e.g. callback from magic link)
    supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      set({ user, session, loading: false });

      if (event === 'SIGNED_IN' && user) {
        const localOnly = getLocalOnlyNotes();
        if (localOnly.length > 0) {
          // Prompt user first
          set({ showSyncPrompt: true, localNotesCount: localOnly.length });
        } else {
          await syncNotesWithCloud(user.id, { uploadLocalNotes: false });
          useNotes.getState().loadNotes();
        }
      } else if (event === 'SIGNED_OUT') {
        purgeCloudNotesFromLocal();
        useNotes.getState().loadNotes();
      }
    });
  },
}));
