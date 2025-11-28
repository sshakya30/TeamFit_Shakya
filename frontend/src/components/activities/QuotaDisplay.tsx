/**
 * QuotaDisplay component for showing quota usage
 * Displays used/limit as a badge with visual indicator
 */

import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import type { QuotaDisplayProps } from '@/types';

export function QuotaDisplay({ used, limit, type = 'public' }: QuotaDisplayProps) {
  const remaining = limit - used;
  const percentUsed = (used / limit) * 100;

  // Determine variant based on usage
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
  if (percentUsed >= 100) {
    variant = 'destructive';
  } else if (percentUsed >= 80) {
    variant = 'default';
  }

  const label = type === 'public' ? 'Customizations' : 'Custom Generations';

  return (
    <Badge variant={variant} className="flex items-center gap-1.5">
      <Zap className="h-3 w-3" />
      <span>
        {used}/{limit} {label}
      </span>
      {remaining <= 2 && remaining > 0 && (
        <span className="text-xs opacity-75">({remaining} left)</span>
      )}
      {remaining <= 0 && (
        <span className="text-xs opacity-75">(limit reached)</span>
      )}
    </Badge>
  );
}
