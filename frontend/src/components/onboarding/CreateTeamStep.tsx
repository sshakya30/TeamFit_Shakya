/**
 * Create Team step component
 * Allows admin to create their first team
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateTeam } from '@/hooks/useCreateTeam';

interface CreateTeamStepProps {
  organizationId: string;
  onSuccess: (teamId: string) => void;
  onBack: () => void;
}

export function CreateTeamStep({ organizationId, onSuccess, onBack }: CreateTeamStepProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const createTeam = useCreateTeam();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    try {
      const result = await createTeam.mutateAsync({
        organization_id: organizationId,
        name: name.trim(),
        description: description.trim() || undefined
      });
      if (result.success && result.team) {
        onSuccess(result.team.id);
      }
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="team-name">Team Name</Label>
          <Input
            id="team-name"
            type="text"
            placeholder="e.g., Engineering Team, Marketing Squad"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={createTeam.isPending}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="team-description">
            Description <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="team-description"
            placeholder="What does this team do? What are its main goals?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={createTeam.isPending}
            rows={3}
          />
        </div>
      </div>

      {createTeam.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {createTeam.error.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={createTeam.isPending}
          className="w-full sm:w-auto"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={!name.trim() || createTeam.isPending}
          className="w-full sm:w-auto sm:ml-auto"
        >
          {createTeam.isPending ? 'Creating...' : 'Create Team'}
        </Button>
      </div>
    </form>
  );
}
