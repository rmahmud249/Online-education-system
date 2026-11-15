
create policy "materials read" on storage.objects for select to anon, authenticated using (
  bucket_id = 'materials' and (
    public.is_staff(auth.uid())
    or exists (select 1 from public.study_materials m where m.file_path = storage.objects.name and m.is_published)
    or exists (select 1 from public.board_questions b where b.file_path = storage.objects.name)
  ));
create policy "materials staff insert" on storage.objects for insert to authenticated with check (bucket_id = 'materials' and public.is_staff(auth.uid()));
create policy "materials staff update" on storage.objects for update to authenticated using (bucket_id = 'materials' and public.is_staff(auth.uid()));
create policy "materials staff delete" on storage.objects for delete to authenticated using (bucket_id = 'materials' and public.is_staff(auth.uid()));
grant execute on function public.is_staff(uuid) to anon;
