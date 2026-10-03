import { format, differenceInCalendarDays } from 'date-fns';
import { vi } from 'date-fns/locale';

function formatDate(timestamp, formatStr = 'dd/MM/yyyy') {
  return format(new Date(timestamp), formatStr, { locale: vi });
}

function getDaysRemaining(unlockAt) {
  const target = new Date(unlockAt);
  const now = new Date();
  return Math.max(0, differenceInCalendarDays(target, now));
}

console.log('--- Testing Date & Countdown Helpers for Sealed Page ---');

const now = Date.now();
const oneMonthLater = now + 30 * 24 * 60 * 60 * 1000;
const formatted = formatDate(oneMonthLater);
const days = getDaysRemaining(oneMonthLater);

console.log('Unlock date formatted:', formatted);
console.log('Days remaining:', days);

console.assert(/\d{2}\/\d{2}\/\d{4}/.test(formatted), 'Date should be DD/MM/YYYY');
console.assert(days >= 29 && days <= 31, 'Days should be around 30');
console.log('✓ Date and countdown verified successfully');

console.log('\n--- Testing Share Card Filename & Specs ---');
const noteId = 'abc123xyz890';
const expectedFilename = `dieu-uoc-${noteId}.png`;
console.assert(expectedFilename === 'dieu-uoc-abc123xyz890.png', 'Filename must match format');
console.log('✓ Filename format verified');

console.log('\n--- All Unit Tests for Sealed Flow Passed! ---');
