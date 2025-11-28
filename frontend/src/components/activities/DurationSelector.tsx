/**
 * DurationSelector component for activity customization
 * Provides radio buttons for selecting 15, 30, or 45 minute durations
 */

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { DurationSelectorProps } from '@/types';

export function DurationSelector({ value, onChange, disabled }: DurationSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Duration</Label>
      <RadioGroup
        value={String(value)}
        onValueChange={(v) => onChange(Number(v) as 15 | 30 | 45)}
        disabled={disabled}
        className="flex gap-4"
      >
        {[15, 30, 45].map((duration) => (
          <div key={duration} className="flex items-center space-x-2">
            <RadioGroupItem
              value={String(duration)}
              id={`duration-${duration}`}
              className="border-2"
            />
            <Label
              htmlFor={`duration-${duration}`}
              className="text-sm cursor-pointer"
            >
              {duration} min
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
