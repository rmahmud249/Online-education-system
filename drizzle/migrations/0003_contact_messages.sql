
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 100),
  email text not null check (length(email) between 5 and 255),
  message text not null check (length(message) between 5 and 2000),
  created_at timestamptz not null default now()
);
grant insert on public.contact_messages to anon, authenticated;
grant select, delete on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;
alter table public.contact_messages enable row level security;
create policy "anyone can send" on public.contact_messages for insert to anon, authenticated with check (true);
create policy "admin reads" on public.contact_messages for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin deletes" on public.contact_messages for delete to authenticated using (public.has_role(auth.uid(),'admin'));
grant execute on function public.admin_exists() to authenticated;
