-- View for upcoming events with organizer info
CREATE VIEW v_upcoming_events AS
SELECT 
    e.*,
    p.first_name as organizer_first_name,
    p.last_name as organizer_last_name,
    p.company as organizer_company,
    COUNT(ea.id) as attendee_count
FROM events e
LEFT JOIN profiles p ON p.id = e.organizer_id
LEFT JOIN event_attendees ea ON ea.event_id = e.id AND ea.status IN ('registered', 'attended')
WHERE e.status = 'published'
AND e.start_date >= NOW()
GROUP BY e.id, p.id
ORDER BY e.start_date ASC;