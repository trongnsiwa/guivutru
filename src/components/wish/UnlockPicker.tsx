import React from 'react';
import { addMonths, addYears, format } from 'date-fns';
import { Chip } from '@/components/ui/Chip';

export interface UnlockPickerProps {
  unlockAt: number;
  onChange: (timestamp: number) => void;
}

export function UnlockPicker({ unlockAt, onChange }: UnlockPickerProps) {
  const now = new Date();

  const handleSelectMonths = (months: number) => {
    const target = addMonths(now, months).getTime();
    onChange(target);
  };

  const handleSelectYears = (years: number) => {
    const target = addYears(now, years).getTime();
    onChange(target);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    if (dateVal) {
      onChange(new Date(dateVal).getTime());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Chip onClick={() => handleSelectMonths(1)}>1 tháng</Chip>
        <Chip onClick={() => handleSelectYears(1)}>1 năm</Chip>
        <Chip onClick={() => handleSelectYears(5)}>5 năm</Chip>
      </div>

      <div className="pt-2">
        <label className="block text-xs font-sans text-text-secondary mb-1">
          Hoặc tự chọn ngày mở:
        </label>
        <input
          type="date"
          value={format(new Date(unlockAt), 'yyyy-MM-dd')}
          onChange={handleDateChange}
          className="w-full rounded-md border border-border-soft bg-bg-soft px-3 py-2 font-sans text-sm text-text-primary focus:border-lavender focus:outline-none"
        />
      </div>
    </div>
  );
}
