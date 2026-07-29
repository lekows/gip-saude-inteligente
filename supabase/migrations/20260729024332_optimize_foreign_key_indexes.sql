create index if not exists idx_training_classes_module
  on public.training_classes(module_id);

create index if not exists idx_training_modules_created_by
  on public.training_modules(created_by);
