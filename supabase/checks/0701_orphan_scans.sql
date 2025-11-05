-- 0701_orphan_scans.sql
-- Find event_attendees without a matching event
SELECT ea.* FROM public.event_attendees ea
LEFT JOIN public.events e ON e.id = ea.event_id
WHERE e.id IS NULL;
