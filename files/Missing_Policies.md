-- ============================================
-- MISSING POLICY 1: SELECT (View/Download files)
-- ============================================

CREATE POLICY "Users can view files in their org"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'team-materials'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text 
    FROM public.team_members 
    WHERE user_id = (
      SELECT id FROM public.users 
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
    AND role IN ('manager', 'admin')
  )
);


-- ============================================
-- MISSING POLICY 2: DELETE (Remove files)
-- ============================================

CREATE POLICY "Admins can delete files in their org"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'team-materials'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text 
    FROM public.team_members 
    WHERE user_id = (
      SELECT id FROM public.users 
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
    AND role = 'admin'
  )
);