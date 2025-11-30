/**
 * FileDropzone component
 * Drag-and-drop file upload area using react-dropzone
 */

import { useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, FileWarning } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from '@/types';

interface FileDropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  onFilesRejected?: (rejections: FileRejection[]) => void;
  disabled?: boolean;
  className?: string;
}

export function FileDropzone({
  onFilesAccepted,
  onFilesRejected,
  disabled = false,
  className,
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (acceptedFiles.length > 0) {
        onFilesAccepted(acceptedFiles);
      }
      if (rejectedFiles.length > 0 && onFilesRejected) {
        onFilesRejected(rejectedFiles);
      }
    },
    [onFilesAccepted, onFilesRejected]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ALLOWED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE_BYTES,
    disabled,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragActive && !isDragReject && 'border-primary bg-primary/5',
        isDragReject && 'border-destructive bg-destructive/5',
        !isDragActive && !disabled && 'border-muted-foreground/25 hover:border-primary/50',
        disabled && 'opacity-50 cursor-not-allowed bg-muted',
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        {isDragReject ? (
          <>
            <FileWarning className="h-12 w-12 text-destructive" />
            <p className="text-destructive font-medium">Invalid file type or size</p>
          </>
        ) : (
          <>
            <Upload
              className={cn(
                'h-12 w-12',
                isDragActive ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            <div className="space-y-1">
              <p className="text-lg font-medium">
                {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Supported: PDF, DOCX, PPTX, XLSX (max 10MB)
            </p>
          </>
        )}
      </div>
    </div>
  );
}
