-- Keep the catalog labels student-facing: the code is displayed separately.
update public.course_catalog
set title = case code
  when 'MAT1275' then 'College Algebra'
  when 'MAT1375' then 'Precalculus'
  when 'MAT1475' then 'Calculus I'
  when 'MAT1575' then 'Calculus II'
  when 'PHYS1433' then 'Physics I — Algebra Based'
  when 'PHYS1441' then 'Physics I — Calculus Based'
  when 'PHYS1442' then 'Physics II — Calculus Based'
  else title
end
where code in ('MAT1275', 'MAT1375', 'MAT1475', 'MAT1575', 'PHYS1433', 'PHYS1441', 'PHYS1442');

-- Existing library PDFs include several files above the original 50 MB limit.
-- The bucket remains private; this only permits an administrator to upload them.
update storage.buckets
set file_size_limit = 314572800,
    allowed_mime_types = array['application/pdf']
where id = 'course-source';
