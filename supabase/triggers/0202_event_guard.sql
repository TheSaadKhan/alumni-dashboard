-- Event triggers
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Prevent event date modifications after event starts
CREATE OR REPLACE FUNCTION prevent_event_date_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.start_date < NOW() AND (NEW.start_date <> OLD.start_date OR NEW.end_date <> OLD.end_date) THEN
        RAISE EXCEPTION 'Cannot modify event dates after event has started';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER prevent_event_date_changes
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_event_date_change();