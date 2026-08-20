-- Keep professor-entered student emails canonical so REST upserts and account
-- lookups address the same enrollment row regardless of casing or whitespace.
-- If historic rows would collide after normalization, retain the most recently
-- joined row (then most recently invited) before enforcing the canonical form.
with ranked as (
  select
    id,
    row_number() over (
      partition by class_section_id, lower(trim(student_email))
      order by joined_at desc nulls last, invited_at desc nulls last, id desc
    ) as row_number
  from public.class_enrollments
)
delete from public.class_enrollments as enrollment
using ranked
where enrollment.id = ranked.id
  and ranked.row_number > 1;

update public.class_enrollments
set student_email = lower(trim(student_email))
where student_email is distinct from lower(trim(student_email));

-- Link invitations made before the student had an account, so their classes
-- appear as soon as their matching profile exists.
update public.class_enrollments as enrollment
set student_id = profile.id,
    status = 'active',
    joined_at = coalesce(enrollment.joined_at, now())
from public.profiles as profile
where enrollment.student_id is null
  and lower(enrollment.student_email) = lower(profile.email);

-- Prevent future non-canonical enrollment emails regardless of their source.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'class_enrollments_student_email_normalized'
      and conrelid = 'public.class_enrollments'::regclass
  ) then
    alter table public.class_enrollments
      add constraint class_enrollments_student_email_normalized
      check (student_email = lower(trim(student_email)));
  end if;
end $$;
