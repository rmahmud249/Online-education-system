
-- ENUMS
create type public.app_role as enum ('admin','teacher','student');
create type public.edu_level as enum ('ssc','hsc');
create type public.material_type as enum ('note','pdf','book','guide','test_paper','suggestion','solution');
create type public.question_type as enum ('mcq','cq');
create type public.exam_type as enum ('mcq','cq','combined');
create type public.exam_scope as enum ('chapter','subject','model_test','board');
create type public.attempt_status as enum ('in_progress','submitted','evaluated');

-- CATALOG
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  level public.edu_level not null unique,
  name_bn text not null, name_en text not null, position int not null default 0
);
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, name_bn text not null, name_en text not null, position int not null default 0
);
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  name_bn text not null, name_en text not null, code text, position int not null default 0,
  created_at timestamptz not null default now()
);
create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  number int not null default 1, name_bn text not null, name_en text,
  created_at timestamptz not null default now()
);

-- PROFILES / ROLES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text, institution text,
  level public.edu_level,
  group_id uuid references public.groups(id) on delete set null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
create table public.staff_permissions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  can_create_exams boolean not null default false,
  can_publish_results boolean not null default false
);
create table public.teacher_subjects (
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  primary key (teacher_id, subject_id)
);

-- CONTENT
create table public.study_materials (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text,
  type public.material_type not null default 'note',
  class_id uuid references public.classes(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  chapter_id uuid references public.chapters(id) on delete set null,
  board text, year int,
  content text, file_path text,
  allow_download boolean not null default true,
  is_published boolean not null default true,
  views int not null default 0,
  created_by uuid,
  created_at timestamptz not null default now()
);
create table public.board_questions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  board text not null, year int not null,
  question_type public.question_type not null default 'cq',
  title text not null, content text, solution text, file_path text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete set null,
  type public.question_type not null default 'mcq',
  body text not null,
  marks numeric not null default 1,
  explanation text,
  board text, year int,
  created_by uuid,
  created_at timestamptz not null default now()
);
create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  position int not null default 0
);
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text,
  type public.exam_type not null default 'mcq',
  scope public.exam_scope not null default 'subject',
  class_id uuid references public.classes(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  chapter_id uuid references public.chapters(id) on delete set null,
  duration_minutes int not null default 20 check (duration_minutes between 1 and 600),
  total_marks numeric not null default 0,
  negative_marking numeric not null default 0,
  starts_at timestamptz, ends_at timestamptz,
  is_published boolean not null default false,
  auto_publish_results boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now()
);
create table public.exam_questions (
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  position int not null default 0,
  marks numeric not null default 1,
  primary key (exam_id, question_id)
);
create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  status public.attempt_status not null default 'in_progress',
  unique (exam_id, student_id)
);
create table public.student_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.exam_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option_id uuid references public.question_options(id) on delete set null,
  answer_text text,
  awarded_marks numeric,
  feedback text,
  evaluated_by uuid,
  updated_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);
create table public.results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.exam_attempts(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  mcq_score numeric not null default 0,
  cq_score numeric not null default 0,
  total_score numeric not null default 0,
  total_marks numeric not null default 0,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null, body text not null,
  is_published boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now()
);
create table public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  material_id uuid not null references public.study_materials(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, material_id)
);
create table public.recent_views (
  user_id uuid not null references public.profiles(id) on delete cascade,
  material_id uuid not null references public.study_materials(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, material_id)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, body text, link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- GRANTS
grant select on public.classes, public.groups, public.subjects, public.chapters, public.study_materials,
  public.board_questions, public.exams, public.notices, public.site_settings to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

-- HELPER FUNCTIONS
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','teacher'))
$$;
create or replace function public.can_manage_subject(_user_id uuid, _subject_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id,'admin')
    or (public.has_role(_user_id,'teacher') and exists (
      select 1 from public.teacher_subjects where teacher_id = _user_id and subject_id = _subject_id))
$$;
create or replace function public.can_manage_exam(_user_id uuid, _exam_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id,'admin') or exists (
    select 1 from public.exams e
    join public.staff_permissions sp on sp.user_id = _user_id and sp.can_create_exams
    where e.id = _exam_id and public.can_manage_subject(_user_id, e.subject_id))
$$;
create or replace function public.can_grade_exam(_user_id uuid, _exam_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id,'admin') or exists (
    select 1 from public.exams e where e.id = _exam_id and public.can_manage_subject(_user_id, e.subject_id))
$$;

-- RLS
alter table public.classes enable row level security;
alter table public.groups enable row level security;
alter table public.subjects enable row level security;
alter table public.chapters enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.staff_permissions enable row level security;
alter table public.teacher_subjects enable row level security;
alter table public.study_materials enable row level security;
alter table public.board_questions enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.student_answers enable row level security;
alter table public.results enable row level security;
alter table public.notices enable row level security;
alter table public.bookmarks enable row level security;
alter table public.recent_views enable row level security;
alter table public.notifications enable row level security;
alter table public.site_settings enable row level security;

-- catalog: public read, admin write
create policy "read classes" on public.classes for select to anon, authenticated using (true);
create policy "admin classes" on public.classes for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "read groups" on public.groups for select to anon, authenticated using (true);
create policy "admin groups" on public.groups for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "read subjects" on public.subjects for select to anon, authenticated using (true);
create policy "admin subjects" on public.subjects for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "read chapters" on public.chapters for select to anon, authenticated using (true);
create policy "manage chapters" on public.chapters for all to authenticated using (public.can_manage_subject(auth.uid(), subject_id)) with check (public.can_manage_subject(auth.uid(), subject_id));

-- profiles
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "admin profile update" on public.profiles for update to authenticated using (public.has_role(auth.uid(),'admin'));

-- roles
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "read own perms" on public.staff_permissions for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin perms" on public.staff_permissions for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "read teacher subjects" on public.teacher_subjects for select to authenticated using (teacher_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin teacher subjects" on public.teacher_subjects for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- materials
create policy "read published materials" on public.study_materials for select to anon, authenticated using (is_published or public.is_staff(auth.uid()));
create policy "insert materials" on public.study_materials for insert to authenticated with check (public.has_role(auth.uid(),'admin') or (subject_id is not null and public.can_manage_subject(auth.uid(), subject_id)));
create policy "update materials" on public.study_materials for update to authenticated using (public.has_role(auth.uid(),'admin') or (subject_id is not null and public.can_manage_subject(auth.uid(), subject_id)));
create policy "delete materials" on public.study_materials for delete to authenticated using (public.has_role(auth.uid(),'admin') or (subject_id is not null and public.can_manage_subject(auth.uid(), subject_id)));

create policy "read board q" on public.board_questions for select to anon, authenticated using (true);
create policy "manage board q" on public.board_questions for all to authenticated using (public.can_manage_subject(auth.uid(), subject_id)) with check (public.can_manage_subject(auth.uid(), subject_id));

-- question bank: staff only (students get questions through secure RPCs)
create policy "staff read questions" on public.questions for select to authenticated using (public.can_manage_subject(auth.uid(), subject_id));
create policy "staff manage questions" on public.questions for all to authenticated using (public.can_manage_subject(auth.uid(), subject_id)) with check (public.can_manage_subject(auth.uid(), subject_id));
create policy "staff options" on public.question_options for all to authenticated
  using (exists (select 1 from public.questions q where q.id = question_id and public.can_manage_subject(auth.uid(), q.subject_id)))
  with check (exists (select 1 from public.questions q where q.id = question_id and public.can_manage_subject(auth.uid(), q.subject_id)));

-- exams
create policy "read exams" on public.exams for select to anon, authenticated using (is_published or public.is_staff(auth.uid()));
create policy "insert exams" on public.exams for insert to authenticated with check (
  public.has_role(auth.uid(),'admin') or (subject_id is not null and public.can_manage_subject(auth.uid(), subject_id)
    and exists (select 1 from public.staff_permissions where user_id = auth.uid() and can_create_exams)));
create policy "update exams" on public.exams for update to authenticated using (public.can_manage_exam(auth.uid(), id));
create policy "delete exams" on public.exams for delete to authenticated using (public.can_manage_exam(auth.uid(), id));
create policy "staff exam questions" on public.exam_questions for all to authenticated
  using (public.can_manage_exam(auth.uid(), exam_id)) with check (public.can_manage_exam(auth.uid(), exam_id));

-- attempts / answers / results (writes happen via security-definer RPCs)
create policy "read attempts" on public.exam_attempts for select to authenticated using (student_id = auth.uid() or public.can_grade_exam(auth.uid(), exam_id));
create policy "read answers" on public.student_answers for select to authenticated using (exists (
  select 1 from public.exam_attempts a where a.id = attempt_id and (a.student_id = auth.uid() or public.can_grade_exam(auth.uid(), a.exam_id))));
create policy "read results" on public.results for select to authenticated using ((student_id = auth.uid() and is_published) or public.can_grade_exam(auth.uid(), exam_id));

-- notices
create policy "read notices" on public.notices for select to anon, authenticated using (is_published or public.has_role(auth.uid(),'admin'));
create policy "admin notices" on public.notices for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- personal
create policy "own bookmarks" on public.bookmarks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own views" on public.recent_views for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own notifications read" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "own notifications update" on public.notifications for update to authenticated using (user_id = auth.uid());
create policy "own notifications delete" on public.notifications for delete to authenticated using (user_id = auth.uid());
create policy "admin notifications insert" on public.notifications for insert to authenticated with check (public.has_role(auth.uid(),'admin'));

create policy "read settings" on public.site_settings for select to anon, authenticated using (true);
create policy "admin settings" on public.site_settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- SIGNUP TRIGGER
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, level)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), new.email,
    case when new.raw_user_meta_data->>'level' in ('ssc','hsc') then (new.raw_user_meta_data->>'level')::public.edu_level else null end);
  insert into public.user_roles (user_id, role) values (new.id, 'student');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Bootstrap: first signed-in user may claim admin while no admin exists
create or replace function public.admin_exists() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where role = 'admin') $$;
create or replace function public.claim_first_admin() returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  perform pg_advisory_xact_lock(424242);
  if exists (select 1 from public.user_roles where role = 'admin') then return false; end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'admin') on conflict do nothing;
  insert into public.staff_permissions (user_id, can_create_exams, can_publish_results) values (auth.uid(), true, true)
    on conflict (user_id) do update set can_create_exams = true, can_publish_results = true;
  return true;
end; $$;

-- EXAM RPCs
create or replace function public.start_exam(p_exam uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare e public.exams; a public.exam_attempts;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into e from public.exams where id = p_exam and is_published;
  if not found then raise exception 'Exam not available'; end if;
  if e.starts_at is not null and now() < e.starts_at then raise exception 'Exam has not started yet'; end if;
  select * into a from public.exam_attempts where exam_id = p_exam and student_id = auth.uid();
  if found then
    if a.status <> 'in_progress' then raise exception 'You have already submitted this exam'; end if;
    return a.id;
  end if;
  if e.ends_at is not null and now() > e.ends_at then raise exception 'Exam has ended'; end if;
  insert into public.exam_attempts (exam_id, student_id, expires_at)
  values (p_exam, auth.uid(), least(now() + make_interval(mins => e.duration_minutes), coalesce(e.ends_at, 'infinity'::timestamptz)))
  returning * into a;
  return a.id;
end; $$;

create or replace function public.get_attempt(p_attempt uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a public.exam_attempts; e public.exams; qs jsonb;
begin
  select * into a from public.exam_attempts where id = p_attempt and student_id = auth.uid();
  if not found then raise exception 'Attempt not found'; end if;
  select * into e from public.exams where id = a.exam_id;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', q.id, 'type', q.type, 'body', q.body, 'marks', eq.marks,
    'options', (select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'text', o.option_text) order by o.position), '[]') from public.question_options o where o.question_id = q.id),
    'selected_option_id', sa.selected_option_id, 'answer_text', sa.answer_text
  ) order by eq.position), '[]') into qs
  from public.exam_questions eq join public.questions q on q.id = eq.question_id
  left join public.student_answers sa on sa.attempt_id = a.id and sa.question_id = q.id
  where eq.exam_id = e.id;
  return jsonb_build_object('attempt_id', a.id, 'status', a.status, 'expires_at', a.expires_at, 'server_now', now(),
    'exam', jsonb_build_object('id', e.id, 'title', e.title, 'type', e.type, 'total_marks', e.total_marks, 'duration_minutes', e.duration_minutes, 'negative_marking', e.negative_marking),
    'questions', qs);
end; $$;

create or replace function public.save_answer(p_attempt uuid, p_question uuid, p_option uuid, p_text text) returns void
language plpgsql security definer set search_path = public as $$
declare a public.exam_attempts;
begin
  select * into a from public.exam_attempts where id = p_attempt and student_id = auth.uid();
  if not found then raise exception 'Attempt not found'; end if;
  if a.status <> 'in_progress' then raise exception 'Exam already submitted'; end if;
  if now() > a.expires_at + interval '15 seconds' then raise exception 'Time is over'; end if;
  if not exists (select 1 from public.exam_questions where exam_id = a.exam_id and question_id = p_question) then raise exception 'Invalid question'; end if;
  if p_option is not null and not exists (select 1 from public.question_options where id = p_option and question_id = p_question) then raise exception 'Invalid option'; end if;
  if p_text is not null and length(p_text) > 20000 then raise exception 'Answer too long'; end if;
  insert into public.student_answers (attempt_id, question_id, selected_option_id, answer_text, updated_at)
  values (p_attempt, p_question, p_option, p_text, now())
  on conflict (attempt_id, question_id) do update set selected_option_id = excluded.selected_option_id, answer_text = excluded.answer_text, updated_at = now();
end; $$;

create or replace function public.recompute_result(p_attempt uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a public.exam_attempts; e public.exams; v_mcq numeric; v_cq numeric; v_total numeric; v_pending int;
begin
  select * into a from public.exam_attempts where id = p_attempt;
  select * into e from public.exams where id = a.exam_id;
  select coalesce(sum(sa.awarded_marks) filter (where q.type='mcq'),0), coalesce(sum(sa.awarded_marks) filter (where q.type='cq'),0)
    into v_mcq, v_cq
  from public.student_answers sa join public.questions q on q.id = sa.question_id where sa.attempt_id = p_attempt;
  select coalesce(sum(eq.marks),0) into v_total from public.exam_questions eq where eq.exam_id = e.id;
  select count(*) into v_pending from public.exam_questions eq join public.questions q on q.id = eq.question_id
    left join public.student_answers sa on sa.attempt_id = p_attempt and sa.question_id = q.id
    where eq.exam_id = e.id and q.type = 'cq' and sa.answer_text is not null and length(trim(sa.answer_text))>0 and sa.awarded_marks is null;
  insert into public.results (attempt_id, exam_id, student_id, mcq_score, cq_score, total_score, total_marks)
  values (p_attempt, e.id, a.student_id, v_mcq, v_cq, v_mcq + v_cq, v_total)
  on conflict (attempt_id) do update set mcq_score = excluded.mcq_score, cq_score = excluded.cq_score, total_score = excluded.total_score, total_marks = excluded.total_marks;
  if v_pending = 0 then update public.exam_attempts set status = 'evaluated' where id = p_attempt; end if;
end; $$;
revoke execute on function public.recompute_result(uuid) from public, anon, authenticated;

create or replace function public.submit_attempt(p_attempt uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a public.exam_attempts; e public.exams; has_cq boolean; r public.results;
begin
  select * into a from public.exam_attempts where id = p_attempt and student_id = auth.uid() for update;
  if not found then raise exception 'Attempt not found'; end if;
  if a.status <> 'in_progress' then raise exception 'Already submitted'; end if;
  select * into e from public.exams where id = a.exam_id;
  -- grade MCQ server-side
  update public.student_answers sa set awarded_marks = case
      when o.is_correct then eq.marks else -abs(e.negative_marking) end
    from public.questions q, public.exam_questions eq, public.question_options o
    where sa.attempt_id = p_attempt and q.id = sa.question_id and q.type = 'mcq'
      and eq.exam_id = e.id and eq.question_id = q.id and o.id = sa.selected_option_id;
  update public.student_answers sa set awarded_marks = 0
    from public.questions q where sa.attempt_id = p_attempt and q.id = sa.question_id and q.type='mcq' and sa.selected_option_id is null;
  update public.exam_attempts set status = 'submitted', submitted_at = now() where id = p_attempt;
  perform public.recompute_result(p_attempt);
  select exists (select 1 from public.exam_questions eq join public.questions q on q.id = eq.question_id where eq.exam_id = e.id and q.type='cq') into has_cq;
  if not has_cq and e.auto_publish_results then
    update public.results set is_published = true, published_at = now() where attempt_id = p_attempt;
  end if;
  select * into r from public.results where attempt_id = p_attempt;
  return jsonb_build_object('published', r.is_published, 'pending_cq', has_cq);
end; $$;

create or replace function public.get_attempt_review(p_attempt uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a public.exam_attempts; r public.results; e public.exams; qs jsonb; staff boolean;
begin
  select * into a from public.exam_attempts where id = p_attempt;
  if not found then raise exception 'Not found'; end if;
  staff := public.can_grade_exam(auth.uid(), a.exam_id);
  if a.student_id <> auth.uid() and not staff then raise exception 'Forbidden'; end if;
  select * into r from public.results where attempt_id = p_attempt;
  select * into e from public.exams where id = a.exam_id;
  if not staff and (r.id is null or not r.is_published) then
    return jsonb_build_object('published', false, 'status', a.status, 'exam', jsonb_build_object('id', e.id, 'title', e.title));
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', q.id, 'type', q.type, 'body', q.body, 'marks', eq.marks, 'explanation', q.explanation,
    'options', (select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'text', o.option_text, 'is_correct', o.is_correct) order by o.position), '[]') from public.question_options o where o.question_id = q.id),
    'answer_id', sa.id, 'selected_option_id', sa.selected_option_id, 'answer_text', sa.answer_text, 'awarded_marks', sa.awarded_marks, 'feedback', sa.feedback
  ) order by eq.position), '[]') into qs
  from public.exam_questions eq join public.questions q on q.id = eq.question_id
  left join public.student_answers sa on sa.attempt_id = a.id and sa.question_id = q.id
  where eq.exam_id = e.id;
  return jsonb_build_object('published', coalesce(r.is_published,false), 'status', a.status, 'submitted_at', a.submitted_at,
    'student_name', (select full_name from public.profiles where id = a.student_id),
    'exam', jsonb_build_object('id', e.id, 'title', e.title, 'type', e.type),
    'result', case when r.id is null then null else jsonb_build_object('mcq', r.mcq_score, 'cq', r.cq_score, 'total', r.total_score, 'total_marks', r.total_marks, 'is_published', r.is_published) end,
    'questions', qs);
end; $$;

create or replace function public.grade_answer(p_answer uuid, p_marks numeric, p_feedback text) returns void
language plpgsql security definer set search_path = public as $$
declare sa public.student_answers; a public.exam_attempts; mx numeric; qt public.question_type;
begin
  select * into sa from public.student_answers where id = p_answer;
  if not found then raise exception 'Answer not found'; end if;
  select * into a from public.exam_attempts where id = sa.attempt_id;
  if not public.can_grade_exam(auth.uid(), a.exam_id) then raise exception 'Forbidden'; end if;
  if a.status = 'in_progress' then raise exception 'Attempt not submitted'; end if;
  select eq.marks, q.type into mx, qt from public.exam_questions eq join public.questions q on q.id = eq.question_id where eq.exam_id = a.exam_id and eq.question_id = sa.question_id;
  if qt <> 'cq' then raise exception 'Only CQ answers can be graded manually'; end if;
  if p_marks < 0 or p_marks > mx then raise exception 'Marks must be between 0 and %', mx; end if;
  update public.student_answers set awarded_marks = p_marks, feedback = p_feedback, evaluated_by = auth.uid() where id = p_answer;
  perform public.recompute_result(a.id);
end; $$;

create or replace function public.publish_exam_results(p_exam uuid) returns int
language plpgsql security definer set search_path = public as $$
declare n int; e public.exams;
begin
  select * into e from public.exams where id = p_exam;
  if not (public.has_role(auth.uid(),'admin') or (public.can_grade_exam(auth.uid(), p_exam)
     and exists (select 1 from public.staff_permissions where user_id = auth.uid() and can_publish_results))) then
    raise exception 'Forbidden'; end if;
  with up as (
    update public.results r set is_published = true, published_at = now()
    from public.exam_attempts a where r.attempt_id = a.id and r.exam_id = p_exam and not r.is_published and a.status = 'evaluated'
    returning r.student_id, r.attempt_id)
  insert into public.notifications (user_id, title, body, link)
    select student_id, 'ফলাফল প্রকাশিত হয়েছে', e.title, '/results/' || attempt_id from up;
  get diagnostics n = row_count;
  return n;
end; $$;

create or replace function public.leaderboard(p_exam uuid default null) returns table(student_id uuid, full_name text, total numeric, exams int)
language sql stable security definer set search_path = public as $$
  select r.student_id, coalesce(nullif(p.full_name,''),'শিক্ষার্থী'), sum(r.total_score), count(*)::int
  from public.results r join public.profiles p on p.id = r.student_id
  where r.is_published and (p_exam is null or r.exam_id = p_exam)
  group by r.student_id, p.full_name order by 3 desc limit 50
$$;

create or replace function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'Forbidden'; end if;
  return jsonb_build_object(
    'students', (select count(*) from public.user_roles where role='student'),
    'teachers', (select count(*) from public.user_roles where role='teacher'),
    'materials', (select count(*) from public.study_materials),
    'questions', (select count(*) from public.questions),
    'exams', (select count(*) from public.exams),
    'attempts', (select count(*) from public.exam_attempts),
    'pending_cq', (select count(*) from public.exam_attempts where status='submitted'));
end; $$;

create or replace function public.increment_material_view(p_material uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.study_materials set views = views + 1 where id = p_material and is_published;
  if auth.uid() is not null then
    insert into public.recent_views (user_id, material_id, viewed_at) values (auth.uid(), p_material, now())
    on conflict (user_id, material_id) do update set viewed_at = now();
  end if;
end; $$;

revoke execute on all functions in schema public from anon;
grant execute on function public.leaderboard(uuid) to anon;
grant execute on function public.increment_material_view(uuid) to anon;
grant execute on function public.has_role(uuid, public.app_role) to anon;
grant execute on function public.is_staff(uuid) to anon;
