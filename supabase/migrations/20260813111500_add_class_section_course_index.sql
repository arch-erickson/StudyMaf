-- Course filtering and joins in the administrator dashboard.
create index if not exists class_sections_course_idx on public.class_sections (course_id);
