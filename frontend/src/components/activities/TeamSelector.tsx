/**
 * TeamSelector component for multi-team users
 * Allows selection of which team to customize activities for
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';
import type { TeamSelectorProps } from '@/types';

export function TeamSelector({
  teams,
  selectedTeamId,
  onSelect,
  disabled,
}: TeamSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Select Team</Label>
      <Select
        value={selectedTeamId || undefined}
        onValueChange={onSelect}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Choose a team" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {teams.map((membership) => (
            <SelectItem key={membership.team_id} value={membership.team_id}>
              <div className="flex items-center gap-2">
                <span>{membership.teams.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({membership.organizations.name})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
