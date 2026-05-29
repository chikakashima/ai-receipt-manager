create extension if not exists "pgcrypto";

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_date date not null,
  store_name text not null,
  total_amount integer not null default 0,
  tax_amount integer not null default 0,
  category text not null default '',
  memo text not null default '',
  image_url text,
  line_user_id text,
  created_at timestamp with time zone default now()
);

alter table public.receipts
  add column if not exists line_user_id text;

create index if not exists receipts_receipt_date_idx
  on public.receipts (receipt_date desc);

create index if not exists receipts_created_at_idx
  on public.receipts (created_at desc);

create index if not exists receipts_line_user_id_idx
  on public.receipts (line_user_id);

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do update set public = true;
