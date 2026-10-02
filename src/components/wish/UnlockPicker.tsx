import React, { useState } from 'react';
import { addMonths, addYears, addDays, format } from 'date-fns';
import { Chip } from '@/components/ui/Chip';

export interface UnlockPickerProps {
  unlockAt: number;
  onChange: (timestamp: number) => void;
}

export function UnlockPicker({ unlockAt, onChange }: UnlockPickerProps) {
  const [isCustom, setIsCustom] = useState(false);
  const now = new Date();
  const minDate = addDays(now, 7);
  const minDateStr = format(minDate, 'yyyy-MM-dd');

  const handleSelectMonths = (months: number) => {
    setIsCustom(false);
    const target = addMonths(now, months).getTime();
    onChange(target);
  };

  const handleSelectYears = (years: number) => {
    setIsCustom(false);
    const target = addYears(now, years).getTime();
    onChange(target);
  };

  const handleSelectCustom = () => {
    setIsCustom(true);
    // If current unlockAt is in the past or < 7 days, set to minDate
    if (unlockAt < minDate.getTime()) {
      onChange(minDate.getTime());
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    if (dateVal) {
      // Set to midnight local time of chosen date
      const selectedDate = new Date(`${dateVal}T00:00:00`);
      onChange(selectedDate.getTime());
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
        <Chip
          active={!isCustom && Math.abs(unlockAt - addMonths(now, 1).getTime()) < 86400000 * 2}
          onClick={() => handleSelectMonths(1)}
          className="justify-center text-center py-2.5 font-sans"
        >
          1 tháng
        </Chip>

        <Chip
          active={!isCustom && Math.abs(unlockAt - addYears(now, 1).getTime()) < 86400000 * 2}
          onClick={() => handleSelectYears(1)}
          className="justify-center text-center py-2.5 font-sans"
        >
          1 năm
        </Chip>

        <Chip
          active={!isCustom && Math.abs(unlockAt - addYears(now, 5).getTime()) < 86400000 * 2}
          onClick={() => handleSelectYears(5)}
          className="justify-center text-center py-2.5 font-sans"
        >
          5 năm
        </Chip>

        <Chip
          active={isCustom}
          onClick={handleSelectCustom}
          className="justify-center text-center py-2.5 font-sans"
        >
          Tự chọn 📅
        </Chip>
      </div>

      {isCustom && (
        <div className="pt-2 animate-fadeIn space-y-1.5">
          <label className="block text-xs font-sans text-text-secondary">
            Chọn ngày mở (tối thiểu 7 ngày):
          </label>
          <input
            type="date"
            min={minDateStr}
            value={format(new Date(unlockAt), 'yyyy-MM-dd')}
            onChange={handleDateChange}
            className="w-full rounded-xl border border-border-soft bg-bg-soft/90 px-4 py-3 font-sans text-sm text-text-primary focus:border-lavender focus:ring-1 focus:ring-lavender focus:outline-none transition-colors"
          />
        </div>
      )}
    </div>
  );
}
