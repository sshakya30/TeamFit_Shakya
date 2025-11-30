/**
 * Requirements input section for custom activity generation
 * Includes textarea with character count and validation
 */

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { RequirementsSectionProps } from '@/types';

const MIN_LENGTH = 10;
const MAX_LENGTH = 2000;

/**
 * RequirementsSection component
 * Renders a textarea for entering activity requirements with validation feedback
 */
export function RequirementsSection({
  value,
  onChange,
  disabled = false,
  error,
}: RequirementsSectionProps) {
  const charCount = value.length;
  const isOverLimit = charCount > MAX_LENGTH;
  const isUnderLimit = charCount > 0 && charCount < MIN_LENGTH;

  return (
    <div className="space-y-2">
      <Label htmlFor="requirements">
        Activity Requirements <span className="text-red-500">*</span>
      </Label>
      <Textarea
        id="requirements"
        placeholder="Describe what kind of team-building activities you need. Include goals, team dynamics, preferences, or any specific themes you'd like to explore..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`min-h-[150px] ${error || isOverLimit ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        aria-describedby="requirements-help"
      />
      <div className="flex justify-between text-sm">
        <div className="text-muted-foreground" id="requirements-help">
          {isUnderLimit && (
            <span className="text-amber-500">
              At least {MIN_LENGTH} characters required
            </span>
          )}
          {isOverLimit && (
            <span className="text-red-500">
              Maximum {MAX_LENGTH} characters allowed
            </span>
          )}
          {error && !isUnderLimit && !isOverLimit && (
            <span className="text-red-500">{error}</span>
          )}
          {!isUnderLimit && !isOverLimit && !error && (
            <span>
              Describe your ideal team activities in detail for best results
            </span>
          )}
        </div>
        <div
          className={`tabular-nums ${
            isOverLimit
              ? 'text-red-500'
              : isUnderLimit
              ? 'text-amber-500'
              : 'text-muted-foreground'
          }`}
        >
          {charCount} / {MAX_LENGTH}
        </div>
      </div>
    </div>
  );
}

/**
 * Validate requirements input
 * @returns Error message or null if valid
 */
export function validateRequirements(value: string): string | null {
  if (!value || value.trim().length === 0) {
    return 'Please describe your activity requirements';
  }
  if (value.length < MIN_LENGTH) {
    return `Requirements must be at least ${MIN_LENGTH} characters`;
  }
  if (value.length > MAX_LENGTH) {
    return `Requirements must be less than ${MAX_LENGTH} characters`;
  }
  return null;
}
