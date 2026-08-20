-- Supabase Free enforces a 50 MB global Storage limit. Keep the bucket and UI
-- aligned with that platform limit so large uploads fail early and clearly.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['application/pdf']
where id = 'course-source';
