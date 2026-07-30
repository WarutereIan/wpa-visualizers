-- Allow date columns in the virtual schema catalog (query pipeline rebuild Phase 1)
alter table public.data_table_columns
  drop constraint if exists data_table_columns_data_type_check;

alter table public.data_table_columns
  add constraint data_table_columns_data_type_check
  check (data_type in ('string', 'number', 'boolean', 'date'));

comment on column public.data_table_columns.data_type is
  'string | number | boolean | date — drives aggregation and filter operators';
