alter table if exists public.budgets
add column if not exists period text not null default 'monthly';

update public.budgets
set period = 'monthly'
where period is null;

alter table if exists public.budgets
drop constraint if exists budgets_period_check;

alter table if exists public.budgets
add constraint budgets_period_check
check (period in ('monthly', 'weekly'));

create unique index if not exists budgets_category_period_unique_idx
on public.budgets (category_id, period);
