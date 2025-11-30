/**
 * MaterialsSection component
 * Allows selection of uploaded team materials to include in generation context
 */

import { FileText, File, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useTeamMaterials } from '@/hooks/useTeamMaterials';
import { FILE_TYPE_COLORS } from '@/types';
import type { MaterialsSectionProps } from '@/types';

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get icon for file type
 */
function getFileIcon(fileType: string) {
  const colorClass = FILE_TYPE_COLORS[fileType] || 'text-gray-500';
  return <FileText className={`h-4 w-4 ${colorClass}`} />;
}

/**
 * MaterialsSection component
 * Displays team materials as checkboxes for selection
 */
export function MaterialsSection({
  teamId,
  selectedIds,
  onSelectionChange,
  disabled = false,
}: MaterialsSectionProps) {
  const { data: materials, isLoading, isError } = useTeamMaterials(teamId);

  const handleToggle = (materialId: string) => {
    if (selectedIds.includes(materialId)) {
      onSelectionChange(selectedIds.filter((id) => id !== materialId));
    } else {
      onSelectionChange([...selectedIds, materialId]);
    }
  };

  const handleSelectAll = () => {
    if (materials) {
      if (selectedIds.length === materials.length) {
        onSelectionChange([]);
      } else {
        onSelectionChange(materials.map((m) => m.id));
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading materials...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          Unable to load materials. Generation will proceed without material context.
        </p>
      </div>
    );
  }

  // Empty state
  if (!materials || materials.length === 0) {
    return (
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <File className="h-4 w-4" />
          <span className="text-sm">
            No materials uploaded yet. Activities will be generated based on requirements only.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Include Team Materials (Optional)</Label>
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={disabled}
          className="text-xs text-primary hover:underline disabled:opacity-50"
        >
          {selectedIds.length === materials.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
        {materials.map((material) => (
          <label
            key={material.id}
            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Checkbox
              checked={selectedIds.includes(material.id)}
              onCheckedChange={() => handleToggle(material.id)}
              disabled={disabled}
            />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getFileIcon(material.file_type)}
              <span className="text-sm truncate">{material.file_name}</span>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatFileSize(material.file_size_bytes)}
            </span>
          </label>
        ))}
      </div>
      {selectedIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedIds.length} material{selectedIds.length !== 1 ? 's' : ''} selected.
          Content will be used to personalize generated activities.
        </p>
      )}
    </div>
  );
}
