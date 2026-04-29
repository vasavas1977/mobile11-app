create table public.vat_receipt_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) not null,
  user_id uuid references auth.users(id),
  receipt_type text not null check (receipt_type in ('personal', 'company')),
  first_name text not null,
  last_name text not null,
  address text not null,
  phone text not null,
  email text not null,
  id_number text,
  company_tax_id text,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table public.vat_receipt_requests enable row level security;

create policy "Users can insert own vat requests"
  on public.vat_receipt_requests for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view own vat requests"
  on public.vat_receipt_requests for select to authenticated
  using (auth.uid() = user_id);

create policy "Guest vat requests"
  on public.vat_receipt_requests for insert to anon
  with check (user_id is null);