/**
 * MaterialsList component
 * Displays a list of materials with loading skeleton and empty state
 */

import { FileBox } from 'lucide-react';
import { MaterialCard } from './MaterialCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Material } from '@/types';

interface MaterialsListProps {
  materials: Material[];
  isLoading: boolean;
  onDeleteMaterial?: (materialId: string) => void;
  deletingId?: string | null;
}

function MaterialSkeleton() {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <FileBox className="mx-auto h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-medium">No materials yet</h3>
      <p className="mt-2 text-muted-foreground">
        Upload your first file to get started. Supported formats: PDF, DOCX, PPTX, XLSX.
      </p>
    </div>
  );
}

export function MaterialsList({
  materials,
  isLoading,
  onDeleteMaterial,
  deletingId,
}: MaterialsListProps) {
  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <MaterialSkeleton />
        <MaterialSkeleton />
        <MaterialSkeleton />
      </div>
    );
  }

  // Show empty state
  if (materials.length === 0) {
    return <EmptyState />;
  }

  // Show materials list
  return (
    <div className="space-y-4">
      {materials.map((material) => (
        <MaterialCard
          key={material.id}
          material={material}
          onDelete={onDeleteMaterial}
          isDeleting={deletingId === material.id}
        />
      ))}
    </div>
  );
}
