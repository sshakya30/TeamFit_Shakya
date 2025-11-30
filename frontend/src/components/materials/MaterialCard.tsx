/**
 * MaterialCard component
 * Displays a single material with file icon, name, date, and summary
 * Includes delete functionality with confirmation dialog
 */

import { useState } from 'react';
import { FileText, Presentation, Sheet, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { Material } from '@/types';
import { FILE_TYPE_COLORS } from '@/types';

interface MaterialCardProps {
  material: Material;
  onDelete?: (materialId: string) => void;
  isDeleting?: boolean;
}

const FILE_TYPE_ICONS = {
  pdf: FileText,
  docx: FileText,
  pptx: Presentation,
  xlsx: Sheet,
} as const;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function MaterialCard({ material, onDelete, isDeleting }: MaterialCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const IconComponent = FILE_TYPE_ICONS[material.file_type] || FileText;
  const colorClass = FILE_TYPE_COLORS[material.file_type] || 'text-gray-500';

  const handleDelete = () => {
    if (onDelete) {
      onDelete(material.id);
      setDialogOpen(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* File Icon */}
          <div
            className={cn(
              'flex-shrink-0 p-2 rounded-lg bg-muted',
              colorClass
            )}
          >
            <IconComponent className="h-6 w-6" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium truncate" title={material.file_name}>
                  {material.file_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(material.file_size_bytes)} &bull; {formatDate(material.created_at)}
                </p>
              </div>

              {/* Delete Button with Confirmation */}
              {onDelete && (
                <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isDeleting}
                      className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Material</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{material.file_name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* Summary Preview */}
            {material.content_summary && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {material.content_summary}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
