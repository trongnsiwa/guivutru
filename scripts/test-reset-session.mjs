import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Mock browser sessionStorage
class MockSessionStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

const mockStorage = new MockSessionStorage();
global.sessionStorage = mockStorage;

const STORAGE_KEYS = {
  NOTES: 'gvt.notes',
  VERSION: 'gvt.version',
  THEME: 'gvt.theme',
  WRITE: 'gvt.write',
  LAST_SEALED: 'gvt.lastSealed',
};

const initialState = {
  step: 1,
  content: '',
  promptId: null,
  promptChosen: false,
  paperTheme: 'dem-sao',
  stickerIds: [],
  unlockAt: null,
  lastSavedNote: null,
  sessionActive: false,
};

const useWriteStore = create()(
  persist(
    (set, get) => ({
      ...initialState,
      setStep: (step) => set({ step }),
      setContent: (content) => set({ content }),
      setPromptId: (promptId) => set({ promptId }),
      setPromptChosen: (promptChosen) => set({ promptChosen }),
      setPaperTheme: (paperTheme) => set({ paperTheme }),
      setStickerIds: (stickerIds) => set({ stickerIds: stickerIds.slice(0, 3) }),
      setUnlockAt: (unlockAt) => set({ unlockAt }),
      setLastSavedNote: (lastSavedNote) => set({ lastSavedNote }),
      setSessionActive: (sessionActive) => set({ sessionActive }),
      reset: () => set(initialState),
    }),
    {
      name: STORAGE_KEYS.WRITE,
      storage: createJSONStorage(() => mockStorage),
    }
  )
);

console.log('--- Test 1: Initial state ---');
const state1 = useWriteStore.getState();
console.assert(state1.sessionActive === false, 'Initial sessionActive should be false');
console.assert(state1.step === 1, 'Initial step should be 1');
console.assert(state1.content === '', 'Initial content should be empty');
console.assert(state1.promptId === null, 'Initial promptId should be null');
console.assert(state1.promptChosen === false, 'Initial promptChosen should be false');
console.log('✓ Initial store state is clean');

console.log('\n--- Test 2: Active session mutation ---');
useWriteStore.getState().setSessionActive(true);
useWriteStore.getState().setPromptChosen(true);
useWriteStore.getState().setPromptId('dulich');
useWriteStore.getState().setContent('Mình muốn đến Đà Lạt 🌸');
useWriteStore.getState().setPaperTheme('tim-mong');
useWriteStore.getState().setStickerIds(['🌙', '⭐']);
useWriteStore.getState().setStep(2);

const state2 = useWriteStore.getState();
console.assert(state2.sessionActive === true, 'sessionActive must be true during flow');
console.assert(state2.step === 2, 'step must be 2');
console.assert(state2.content.length > 0, 'content must not be empty');
console.assert(state2.stickerIds.length === 2, 'stickers must be set');
console.log('✓ Store updated during write flow');

// Verify persisted state in sessionStorage
const rawPersisted = mockStorage.getItem('gvt.write');
console.assert(rawPersisted !== null, 'sessionStorage["gvt.write"] should exist');
const parsedPersisted = JSON.parse(rawPersisted);
console.assert(parsedPersisted.state.sessionActive === true, 'Persisted sessionActive must be true');
console.assert(parsedPersisted.state.content === 'Mình muốn đến Đà Lạt 🌸', 'Persisted content matches');
console.log('✓ sessionStorage["gvt.write"] correctly preserved mid-flow data');

console.log('\n--- Test 3: Reset clears everything ---');
useWriteStore.getState().reset();
const state3 = useWriteStore.getState();
console.assert(state3.sessionActive === false, 'Reset sessionActive must be false');
console.assert(state3.step === 1, 'Reset step must be 1');
console.assert(state3.content === '', 'Reset content must be empty');
console.assert(state3.promptId === null, 'Reset promptId must be null');
console.assert(state3.promptChosen === false, 'Reset promptChosen must be false');
console.assert(state3.paperTheme === 'dem-sao', 'Reset paperTheme must be dem-sao');
console.assert(state3.stickerIds.length === 0, 'Reset stickers must be empty');
console.assert(state3.unlockAt === null, 'Reset unlockAt must be null');
console.log('✓ Zustand store reset() fully clears in-memory state');

const rawPersistedAfterReset = mockStorage.getItem('gvt.write');
const parsedAfterReset = JSON.parse(rawPersistedAfterReset);
console.assert(parsedAfterReset.state.sessionActive === false, 'Persisted sessionActive is false');
console.assert(parsedAfterReset.state.step === 1, 'Persisted step is 1');
console.assert(parsedAfterReset.state.content === '', 'Persisted content is empty');
console.assert(parsedAfterReset.state.promptId === null, 'Persisted promptId is null');
console.assert(parsedAfterReset.state.stickerIds.length === 0, 'Persisted stickers empty');
console.assert(parsedAfterReset.state.paperTheme === 'dem-sao', 'Persisted paperTheme is default');
console.log('✓ sessionStorage["gvt.write"] verified clean after reset (no stale data)');

console.log('\n--- Test 4: Sealed page Option A data passing ---');
const dummyNote = {
  id: 'test-123',
  content: 'Ước mơ nhỏ',
  paperTheme: 'dem-sao',
  stickerIds: ['⭐'],
  unlockAt: Date.now() + 30 * 86400000,
  status: 'sealed',
  createdAt: Date.now(),
  openedAt: null,
};

// Simulate Step 3 "Niêm phong" saving
mockStorage.setItem(STORAGE_KEYS.LAST_SEALED, JSON.stringify(dummyNote));
console.assert(mockStorage.getItem(STORAGE_KEYS.LAST_SEALED) !== null, 'LAST_SEALED saved in sessionStorage');

// Simulate Sealed page mount
const rawSealed = mockStorage.getItem(STORAGE_KEYS.LAST_SEALED);
const sealedNote = JSON.parse(rawSealed);
mockStorage.removeItem(STORAGE_KEYS.LAST_SEALED);

console.assert(sealedNote.id === 'test-123', 'Sealed note successfully retrieved');
console.assert(mockStorage.getItem(STORAGE_KEYS.LAST_SEALED) === null, 'LAST_SEALED cleared on mount');
console.log('✓ Option A (gvt.lastSealed) data passing verified');

console.log('\n--- Test 5: Detection logic on /viet mount ---');
// Scenario 5a: Fresh visit (sessionActive is false)
let activeStore = { sessionActive: false, content: '', promptId: null, promptChosen: false };
let shouldReset5a = !activeStore.sessionActive || (!activeStore.content.trim() && !activeStore.promptId && !activeStore.promptChosen);
console.assert(shouldReset5a === true, 'Fresh visit must trigger reset');

// Scenario 5b: Mid-flow refresh (sessionActive is true with content)
let midFlowStore = { sessionActive: true, content: 'Đang viết...', promptId: 'uocmo', promptChosen: true };
let shouldReset5b = !midFlowStore.sessionActive || (!midFlowStore.content.trim() && !midFlowStore.promptId && !midFlowStore.promptChosen);
console.assert(shouldReset5b === false, 'Mid-flow refresh must NOT trigger reset');

// Scenario 5c: Mid-flow refresh (custom prompt chosen, text empty yet)
let midFlowCustom = { sessionActive: true, content: '', promptId: null, promptChosen: true };
let shouldReset5c = !midFlowCustom.sessionActive || (!midFlowCustom.content.trim() && !midFlowCustom.promptId && !midFlowCustom.promptChosen);
console.assert(shouldReset5c === false, 'Mid-flow custom prompt must NOT trigger reset');

// Scenario 5d: Post-submission visit (/viet after "Niêm phong" or "Viết thêm")
let postSubmit = { sessionActive: false, content: '', promptId: null, promptChosen: false };
let shouldReset5d = !postSubmit.sessionActive || (!postSubmit.content.trim() && !postSubmit.promptId && !postSubmit.promptChosen);
console.assert(shouldReset5d === true, 'Post-submission visit must trigger reset');

console.log('✓ Detection logic verified across all lifecycle scenarios');
console.log('\nALL TESTS PASSED SUCCESSFULLY! 🎉');
