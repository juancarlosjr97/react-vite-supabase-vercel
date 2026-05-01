alter table if exists public.budgets enable row level security;

drop policy if exists "BUDGETS_SELECT_OWN" on public.budgets;
drop policy if exists "BUDGETS_INSERT_OWN" on public.budgets;
drop policy if exists "BUDGETS_UPDATE_OWN" on public.budgets;
drop policy if exists "BUDGETS_DELETE_OWN" on public.budgets;

create policy "BUDGETS_SELECT_OWN"
on public.budgets
for select
using (auth.uid() = user_id);

create policy "BUDGETS_INSERT_OWN"
on public.budgets
for insert
with check (auth.uid() = user_id);

create policy "BUDGETS_UPDATE_OWN"
on public.budgets
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "BUDGETS_DELETE_OWN"
on public.budgets
for delete
using (auth.uid() = user_id);
