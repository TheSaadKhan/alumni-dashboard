-- View for job feed with company info
CREATE VIEW v_job_feed AS
SELECT 
    j.*,
    p.first_name as poster_first_name,
    p.last_name as poster_last_name,
    p.company as poster_company,
    ARRAY_AGG(DISTINCT js.skill_name) as required_skills
FROM job_postings j
LEFT JOIN profiles p ON p.id = j.posted_by
LEFT JOIN job_skills js ON js.job_id = j.id
WHERE j.is_active = true
AND j.expiry_date >= CURRENT_DATE
GROUP BY j.id, p.id
ORDER BY j.created_at DESC;