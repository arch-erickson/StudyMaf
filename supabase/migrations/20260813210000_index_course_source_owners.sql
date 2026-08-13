-- Keep administrator-source lookups fast as more course builds are added.
create index if not exists course_documents_uploaded_by_idx
  on public.course_documents (uploaded_by, uploaded_at desc);

create index if not exists course_ingestion_jobs_requested_by_idx
  on public.course_ingestion_jobs (requested_by, requested_at desc);
