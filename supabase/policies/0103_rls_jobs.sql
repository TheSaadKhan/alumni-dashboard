-- Job postings policies
CREATE POLICY "Anyone can view active jobs" ON job_postings
FOR SELECT USING (is_active = true AND expiry_date >= CURRENT_DATE);

CREATE POLICY "Users can post jobs" ON job_postings
FOR INSERT WITH CHECK (auth.uid() IN (
  SELECT auth_user_id FROM profiles WHERE id = posted_by
));

CREATE POLICY "Users can update own job posts" ON job_postings
FOR UPDATE USING (auth.uid() IN (
  SELECT auth_user_id FROM profiles WHERE id = posted_by
));

-- Job applications policies
CREATE POLICY "Users can view own applications" ON job_applications
FOR SELECT USING (auth.uid() IN (
  SELECT auth_user_id FROM profiles WHERE id = applicant_id
));

CREATE POLICY "Users can apply for jobs" ON job_applications
FOR INSERT WITH CHECK (auth.uid() IN (
  SELECT auth_user_id FROM profiles WHERE id = applicant_id
));

CREATE POLICY "Job posters can view applications for their jobs" ON job_applications
FOR SELECT USING (EXISTS (
  SELECT 1 FROM job_postings 
  WHERE job_postings.id = job_id 
  AND job_postings.posted_by IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
));