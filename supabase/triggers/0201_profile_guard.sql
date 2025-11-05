-- Profile update triggers
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Ensure email uniqueness across auth and profiles
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Update auth user email if profile email changes
    IF NEW.email <> OLD.email THEN
        UPDATE auth.users 
        SET email = NEW.email 
        WHERE id = NEW.auth_user_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_profile_email_trigger
    AFTER UPDATE OF email ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_profile_email();