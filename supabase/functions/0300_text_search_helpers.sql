-- Search profiles with multiple criteria
CREATE OR REPLACE FUNCTION search_profiles(
    search_query TEXT DEFAULT NULL,
    graduation_years INTEGER[] DEFAULT NULL,
    industries TEXT[] DEFAULT NULL,
    locations TEXT[] DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    first_name VARCHAR,
    last_name VARCHAR,
    graduation_year INTEGER,
    industry VARCHAR,
    location VARCHAR,
    current_position VARCHAR,
    company VARCHAR,
    similarity_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.graduation_year,
        p.industry,
        p.location,
        p.current_position,
        p.company,
        GREATEST(
            CASE WHEN search_query IS NOT NULL THEN 
                similarity(LOWER(p.first_name || ' ' || p.last_name), LOWER(search_query)) 
            ELSE 0 END,
            CASE WHEN search_query IS NOT NULL THEN 
                similarity(LOWER(p.company), LOWER(search_query)) 
            ELSE 0 END,
            CASE WHEN search_query IS NOT NULL THEN 
                similarity(LOWER(p.current_position), LOWER(search_query)) 
            ELSE 0 END
        ) as similarity_score
    FROM profiles p
    WHERE p.is_active = true
    AND (privacy_settings->>'profile_visible')::boolean = true
    AND (search_query IS NULL OR 
         p.first_name ILIKE '%' || search_query || '%' OR
         p.last_name ILIKE '%' || search_query || '%' OR
         p.company ILIKE '%' || search_query || '%' OR
         p.current_position ILIKE '%' || search_query || '%')
    AND (graduation_years IS NULL OR p.graduation_year = ANY(graduation_years))
    AND (industries IS NULL OR p.industry = ANY(industries))
    AND (locations IS NULL OR p.location ILIKE ANY(locations))
    ORDER BY similarity_score DESC, p.first_name, p.last_name
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;