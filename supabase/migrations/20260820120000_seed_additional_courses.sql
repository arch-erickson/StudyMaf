-- Seed the six additional published courses into the catalog so they appear in
-- Control (Course builds), can be assigned to sections by professors, and are
-- joinable by students — the same way PHYS1442 was seeded in
-- 20260813090000_add_accounts_roles_and_classes.sql. Lesson content is served
-- from the static catalog by course code (matching PHYS1442, whose DB row also
-- carries no inline lessons), so only the catalog metadata is inserted here.
-- Idempotent: on conflict (code) do nothing.

insert into public.course_catalog (code, title, subject, description, textbooks)
values
  (
    'MAT1475',
    'MAT 1475 — Calculus I',
    'mathematics',
    'Limits, derivatives, and the definite integral.',
    '["Calculus, Volume 1 — OpenStax"]'::jsonb
  ),
  (
    'MAT1575',
    'MAT 1575 — Calculus II',
    'mathematics',
    'Integration techniques, sequences, and series.',
    '["Calculus, Volume 1 — OpenStax", "Calculus, Volume 2 — OpenStax"]'::jsonb
  ),
  (
    'MAT1275',
    'MAT 1275 — College Algebra',
    'mathematics',
    'Algebraic foundations, functions, and right-triangle trigonometry.',
    '["College Algebra & Trigonometry — Carley & Masuda", "Intermediate Algebra 2e — OpenStax"]'::jsonb
  ),
  (
    'MAT1375',
    'MAT 1375 — Precalculus',
    'mathematics',
    'Functions, polynomials, rational functions, exponentials, and logarithms.',
    '["Precalculus — Tradler & Carley (City Tech)", "Precalculus — OpenStax"]'::jsonb
  ),
  (
    'PHYS1441',
    'PHYS 1441 — Physics I (Calculus Based)',
    'physics',
    'Mechanics, fluids, oscillations, and thermodynamics with calculus.',
    '["University Physics Volume 1 — OpenStax"]'::jsonb
  ),
  (
    'PHYS1433',
    'PHYS 1433 — Physics I (Algebra Based)',
    'physics',
    'Mechanics, fluids, oscillations, heat, and waves with algebra.',
    '["College Physics — OpenStax"]'::jsonb
  )
on conflict (code) do nothing;
