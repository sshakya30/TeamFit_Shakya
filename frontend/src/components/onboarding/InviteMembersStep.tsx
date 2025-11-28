/**
 * Invite Members step component
 * Allows inviting team members via email
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInviteMember } from '@/hooks/useInviteMember';
import { usePendingInvitations } from '@/hooks/usePendingInvitations';
import { useCancelInvitation } from '@/hooks/useCancelInvitation';

interface InviteMembersStepProps {
  teamId: string;
  organizationId: string;
  onNext: () => void;
  onBack: () => void;
}

export function InviteMembersStep({
  teamId,
  organizationId,
  onNext,
  onBack
}: InviteMembersStepProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [lastInviteMessage, setLastInviteMessage] = useState<string | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  const inviteMember = useInviteMember();
  const { data: pendingInvitations, isLoading: loadingInvitations } = usePendingInvitations(teamId);
  const cancelInvitation = useCancelInvitation();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    try {
      const result = await inviteMember.mutateAsync({
        team_id: teamId,
        organization_id: organizationId,
        email: email.trim(),
        full_name: fullName.trim() || undefined,
        role: 'member'
      });

      if (result.success) {
        setLastInviteMessage(result.invite_message);
        setEmail('');
        setFullName('');
      }
    } catch (error) {
      console.error('Failed to invite member:', error);
    }
  };

  const handleCopyMessage = async () => {
    if (lastInviteMessage) {
      await navigator.clipboard.writeText(lastInviteMessage);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitation.mutateAsync({ invitationId, teamId });
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleInvite} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="member-email">Email Address</Label>
            <Input
              id="member-email"
              type="email"
              placeholder="teammate@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={inviteMember.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-name">
              Name <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="member-name"
              type="text"
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={inviteMember.isPending}
            />
          </div>
        </div>

        {inviteMember.error && (
          <Alert variant="destructive">
            <AlertDescription>
              {inviteMember.error.message}
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          variant="secondary"
          disabled={!email.trim() || inviteMember.isPending}
          className="w-full"
        >
          {inviteMember.isPending ? 'Adding...' : 'Add Team Member'}
        </Button>
      </form>

      {/* Copyable invite message */}
      {lastInviteMessage && (
        <Card className="bg-muted/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Share this invite message:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyMessage}
              >
                {showCopied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <pre className="text-xs whitespace-pre-wrap font-mono bg-background p-3 rounded border">
              {lastInviteMessage}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Pending invitations list */}
      {!loadingInvitations && pendingInvitations && pendingInvitations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Pending Invitations</h4>
          <div className="space-y-2">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {invitation.full_name || invitation.email}
                    </p>
                    {invitation.full_name && (
                      <p className="text-xs text-muted-foreground">
                        {invitation.email}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {invitation.role}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancelInvitation(invitation.id)}
                  disabled={cancelInvitation.isPending}
                  className="text-muted-foreground hover:text-destructive"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loadingInvitations && (!pendingInvitations || pendingInvitations.length === 0) && !lastInviteMessage && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No invitations yet. Add team members above or skip this step.
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="w-full sm:w-auto"
        >
          Back
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onNext}
          className="w-full sm:w-auto"
        >
          Skip for now
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
