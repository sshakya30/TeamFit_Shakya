/**
 * Team Profile step component
 * Collects team context for AI activity personalization
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateTeamProfile } from '@/hooks/useUpdateTeamProfile';

interface TeamProfileStepProps {
  teamId: string;
  organizationId: string;
  onNext: () => void;
  onBack: () => void;
}

const INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Technology / Software' },
  { value: 'finance', label: 'Finance / Banking' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail / E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'consulting', label: 'Consulting / Professional Services' },
  { value: 'media', label: 'Media / Entertainment' },
  { value: 'nonprofit', label: 'Non-profit' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' },
];

const TEAM_SIZE_OPTIONS = [
  { value: '2-5', label: '2-5 members' },
  { value: '6-10', label: '6-10 members' },
  { value: '11-20', label: '11-20 members' },
  { value: '21-50', label: '21-50 members' },
  { value: '50+', label: '50+ members' },
];

export function TeamProfileStep({
  teamId,
  organizationId,
  onNext,
  onBack
}: TeamProfileStepProps) {
  const [teamRoleDescription, setTeamRoleDescription] = useState('');
  const [memberResponsibilities, setMemberResponsibilities] = useState('');
  const [pastActivities, setPastActivities] = useState('');
  const [industry, setIndustry] = useState('');
  const [teamSize, setTeamSize] = useState('');

  const updateProfile = useUpdateTeamProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await updateProfile.mutateAsync({
        team_id: teamId,
        organization_id: organizationId,
        team_role_description: teamRoleDescription.trim() || undefined,
        member_responsibilities: memberResponsibilities.trim() || undefined,
        past_activities_summary: pastActivities.trim() || undefined,
        industry_sector: industry || undefined,
        team_size: teamSize || undefined,
      });

      if (result.success) {
        onNext();
      }
    } catch (error) {
      console.error('Failed to update team profile:', error);
    }
  };

  const handleSkip = () => {
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-muted-foreground text-center mb-4">
        Help us personalize activities for your team. All fields are optional.
      </p>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger id="industry">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-size">Team Size</Label>
            <Select value={teamSize} onValueChange={setTeamSize}>
              <SelectTrigger id="team-size">
                <SelectValue placeholder="Select team size" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="team-role">What does your team do?</Label>
          <Textarea
            id="team-role"
            placeholder="e.g., We're a product team focused on building mobile apps for healthcare..."
            value={teamRoleDescription}
            onChange={(e) => setTeamRoleDescription(e.target.value)}
            disabled={updateProfile.isPending}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsibilities">Team member responsibilities</Label>
          <Textarea
            id="responsibilities"
            placeholder="e.g., Developers, designers, product managers working in agile sprints..."
            value={memberResponsibilities}
            onChange={(e) => setMemberResponsibilities(e.target.value)}
            disabled={updateProfile.isPending}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="past-activities">Past team-building activities</Label>
          <Textarea
            id="past-activities"
            placeholder="e.g., Virtual trivia, escape rooms, coffee chats. Some worked well, escape rooms were a hit..."
            value={pastActivities}
            onChange={(e) => setPastActivities(e.target.value)}
            disabled={updateProfile.isPending}
            rows={2}
          />
        </div>
      </div>

      {updateProfile.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {updateProfile.error.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={updateProfile.isPending}
          className="w-full sm:w-auto"
        >
          Back
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleSkip}
          disabled={updateProfile.isPending}
          className="w-full sm:w-auto"
        >
          Skip for now
        </Button>
        <Button
          type="submit"
          disabled={updateProfile.isPending}
          className="w-full sm:w-auto sm:ml-auto"
        >
          {updateProfile.isPending ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </form>
  );
}
