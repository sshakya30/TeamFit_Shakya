/**
 * Materials page
 * Allows managers/admins to upload, view, and delete team materials
 */

import { useState, useCallback } from 'react';
import { FileRejection } from 'react-dropzone';
import { Layout } from '@/components/layout/Layout';
import { FileDropzone } from '@/components/materials/FileDropzone';
import { UploadProgress } from '@/components/materials/UploadProgress';
import { MaterialsList } from '@/components/materials/MaterialsList';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUser } from '@/hooks/useUser';
import { useUploadMaterial } from '@/hooks/useUploadMaterial';
import { useTeamMaterials } from '@/hooks/useTeamMaterials';
import { useDeleteMaterial } from '@/hooks/useDeleteMaterial';
import { AlertCircle } from 'lucide-react';
import { MAX_FILE_SIZE_BYTES } from '@/types';

export function Materials() {
  const { data: dashboardData } = useUser();
  const { upload, progress, status, error, reset, isUploading } = useUploadMaterial();

  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const teamId = dashboardData?.teamMember?.team_id;
  const organizationId = dashboardData?.teamMember?.organization_id;

  // Fetch team materials
  const { data: materials, isLoading: materialsLoading } = useTeamMaterials(teamId);

  // Delete material mutation
  const { mutateAsync: deleteMaterial } = useDeleteMaterial(teamId);

  const handleFilesAccepted = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file || !teamId || !organizationId) return;

    setValidationError(null);
    setCurrentFile(file);
    reset();

    await upload(file, teamId, organizationId);
  }, [teamId, organizationId, upload, reset]);

  const handleFilesRejected = useCallback((rejections: FileRejection[]) => {
    const rejection = rejections[0];
    if (!rejection) return;

    const errors = rejection.errors;
    let message = 'File rejected: ';

    if (errors.some((e) => e.code === 'file-invalid-type')) {
      message = 'Invalid file type. Please upload PDF, DOCX, PPTX, or XLSX files.';
    } else if (errors.some((e) => e.code === 'file-too-large')) {
      const maxMB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
      message = `File is too large. Maximum size is ${maxMB}MB.`;
    } else {
      message += errors.map((e) => e.message).join(', ');
    }

    setValidationError(message);
    setCurrentFile(null);
  }, []);

  const handleRetry = useCallback(() => {
    if (currentFile && teamId && organizationId) {
      reset();
      upload(currentFile, teamId, organizationId);
    }
  }, [currentFile, teamId, organizationId, reset, upload]);

  const handleDismissUpload = useCallback(() => {
    reset();
    setCurrentFile(null);
  }, [reset]);

  const handleDeleteMaterial = useCallback(async (materialId: string) => {
    try {
      setDeletingId(materialId);
      await deleteMaterial(materialId);
    } catch (err) {
      console.error('Failed to delete material:', err);
    } finally {
      setDeletingId(null);
    }
  }, [deleteMaterial]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Team Materials</h1>
          <p className="text-muted-foreground">
            Upload and manage files for your team. Supported formats: PDF, DOCX, PPTX, XLSX.
          </p>
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        {/* Upload Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload New Material</h2>

          {/* Show dropzone when not uploading */}
          {status === 'idle' && (
            <FileDropzone
              onFilesAccepted={handleFilesAccepted}
              onFilesRejected={handleFilesRejected}
              disabled={isUploading}
            />
          )}

          {/* Show progress when uploading */}
          {currentFile && status !== 'idle' && (
            <UploadProgress
              fileName={currentFile.name}
              progress={progress}
              status={status === 'idle' ? 'uploading' : status}
              error={error || undefined}
              onRetry={status === 'error' ? handleRetry : undefined}
              onCancel={handleDismissUpload}
            />
          )}

          {/* Show success message and allow new upload */}
          {status === 'complete' && (
            <div className="mt-4">
              <p className="text-sm text-green-600 mb-4">
                File uploaded successfully!
              </p>
              <FileDropzone
                onFilesAccepted={handleFilesAccepted}
                onFilesRejected={handleFilesRejected}
                disabled={false}
              />
            </div>
          )}
        </div>

        {/* Materials List */}
        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">Uploaded Materials</h2>
          <MaterialsList
            materials={materials || []}
            isLoading={materialsLoading}
            onDeleteMaterial={handleDeleteMaterial}
            deletingId={deletingId}
          />
        </div>
      </div>
    </Layout>
  );
}
