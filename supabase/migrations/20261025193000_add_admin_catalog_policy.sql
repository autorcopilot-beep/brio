create policy "Admins update food catalog" on public.food_items
for update to authenticated
using (((select auth.jwt())->'app_metadata'->>'role') = 'admin')
with check (((select auth.jwt())->'app_metadata'->>'role') = 'admin');
