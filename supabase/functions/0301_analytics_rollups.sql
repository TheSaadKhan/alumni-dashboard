-- Function to update platform metrics
CREATE OR REPLACE FUNCTION update_platform_metrics()
RETURNS void AS $$
BEGIN
    -- Delete today's metrics
    DELETE FROM platform_metrics 
    WHERE metric_date = CURRENT_DATE;
    
    -- Insert updated metrics
    INSERT INTO platform_metrics (metric_date, metric_name, metric_value)
    VALUES 
        (CURRENT_DATE, 'total_users', (SELECT COUNT(*) FROM profiles WHERE is_active = true)),
        (CURRENT_DATE, 'verified_users', (SELECT COUNT(*) FROM profiles WHERE is_verified = true AND is_active = true)),
        (CURRENT_DATE, 'active_events', (SELECT COUNT(*) FROM events WHERE status = 'published' AND start_date >= NOW())),
        (CURRENT_DATE, 'active_jobs', (SELECT COUNT(*) FROM job_postings WHERE is_active = true AND expiry_date >= CURRENT_DATE)),
        (CURRENT_DATE, 'total_donations', (SELECT COUNT(*) FROM donations WHERE payment_status = 'completed')),
        (CURRENT_DATE, 'donation_amount', (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE payment_status = 'completed'));
END;
$$ LANGUAGE plpgsql;