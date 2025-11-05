-- 0601_seed_orgs.sql
INSERT INTO public.organizations (id, name, slug, created_at)
VALUES (gen_random_uuid(), 'Example University Alumni', 'example-university', now())
ON CONFLICT DO NOTHING;
