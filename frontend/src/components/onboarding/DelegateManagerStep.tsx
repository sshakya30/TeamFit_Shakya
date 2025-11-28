/**
 * Delegate Manager step component
 * Asks admin if they want to invite a manager for the team
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { useInviteMember } from '@/hooks/useInviteMember';

interface DelegateManagerStepProps {
  teamId: string;
  organizationId: string;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function DelegateManagerStep({
  teamId,
  organizationId,
  onNext,
  onSkip,
  onBack
}: DelegateManagerStepProps) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const inviteMember = useInviteMember();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    try {
      const result = await inviteMember.mutateAsync({
        team_id: teamId,
        organization_id: organizationId,
        email: email.trim(),
        full_name: fullName.trim() || undefined,
        role: 'manager'
      });

      if (result.success) {
        setInviteMessage(result.invite_message);
      }
    } catch (error) {
      console.error('Failed to invite manager:', error);
    }
  };

  const handleCopyMessage = async () => {
    if (inviteMessage) {
      await navigator.clipboard.writeText(inviteMessage);
    }
  };

  // Show success state with copyable message
  if (inviteMessage) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>
            Manager invitation created! Share this message with them:
          </AlertDescription>
        </Alert>

        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {inviteMessage}
            </pre>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleCopyMessage}
            className="w-full sm:w-auto"
          >
            Copy Message
          </Button>
          <Button
            onClick={onNext}
            className="w-full sm:w-auto sm:ml-auto"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // Show invitation form
  if (showForm) {
    return (
      <form onSubmit={handleInvite} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manager-email">Manager's Email</Label>
            <Input
              id="manager-email"
              type="email"
              placeholder="manager@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={inviteMember.isPending}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager-name">
              Name <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="manager-name"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={inviteMember.isPending}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          The manager will be able to manage this team's profile, schedule activities,
          and invite team members (but not other managers).
        </p>

        {inviteMember.error && (
          <Alert variant="destructive">
            <AlertDescription>
              {inviteMember.error.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowForm(false)}
            disabled={inviteMember.isPending}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!email.trim() || inviteMember.isPending}
            className="w-full sm:w-auto sm:ml-auto"
          >
            {inviteMember.isPending ? 'Inviting...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    );
  }

  // Show initial choice
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-center">
        Would you like to delegate this team's management to someone else?
        They'll be able to customize activities, invite members, and manage the team profile.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => setShowForm(true)}
        >
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-3">+</div>
            <h4 className="font-medium mb-1">Yes, invite a manager</h4>
            <p className="text-sm text-muted-foreground">
              I'll add someone to manage this team
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={onSkip}
        >
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-3">-</div>
            <h4 className="font-medium mb-1">No, I'll manage it</h4>
            <p className="text-sm text-muted-foreground">
              Skip this for now
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-start pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
        >
          Back
        </Button>
      </div>
    </div>
  );
}
