/**
 * UploadProgress component
 * Shows upload progress bar with status and retry option
 */

import { X, RotateCcw, CheckCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type UploadStatus = 'uploading' | 'processing' | 'complete' | 'error';

interface UploadProgressProps {
  fileName: string;
  progress: number;
  status: UploadStatus;
  error?: string;
  onCancel?: () => void;
  onRetry?: () => void;
}

export function UploadProgress({
  fileName,
  progress,
  status,
  error,
  onCancel,
  onRetry,
}: UploadProgressProps) {
  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return `Uploading... ${progress}%`;
      case 'processing':
        return 'Processing file...';
      case 'complete':
        return 'Upload complete';
      case 'error':
        return error || 'Upload failed';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {getStatusIcon()}
          <span className="font-medium truncate">{fileName}</span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'error' && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-8 px-2"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
          {status === 'error' && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Dismiss
            </Button>
          )}
          {(status === 'uploading' || status === 'processing') && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {(status === 'uploading' || status === 'processing') && (
        <Progress value={status === 'processing' ? 100 : progress} className="h-2" />
      )}

      <p
        className={cn(
          'text-sm mt-2',
          status === 'error' ? 'text-destructive' : 'text-muted-foreground'
        )}
      >
        {getStatusText()}
      </p>
    </div>
  );
}
