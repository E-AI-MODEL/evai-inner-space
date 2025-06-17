-- Table definitions for Supabase
create table if not exists emotion_seeds (
  id uuid primary key default uuid_generate_v4(),
  emotion text,
  label text,
  response jsonb,
  meta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  active boolean default true,
  expires_at timestamptz,
  weight float
);

create table if not exists seed_feedback (
  id uuid primary key default uuid_generate_v4(),
  seed_id uuid references emotion_seeds(id),
  rating text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists seed_rubrics (
  id uuid primary key default uuid_generate_v4(),
  seed_id uuid references emotion_seeds(id),
  rubric text,
  score float,
  created_at timestamptz default now()
);

create table if not exists rubrics (
  id uuid primary key default uuid_generate_v4(),
  code text unique,
  rubric_json jsonb
);

-- Function to increment usage count and update updated_at
create or replace function increment_seed_usage(seed_id uuid)
returns void
language plpgsql
as $$
begin
  update emotion_seeds
  set meta = jsonb_set(coalesce(meta, '{}'::jsonb), '{usageCount}', to_jsonb(coalesce((meta->>'usageCount')::int, 0) + 1)),
      updated_at = now()
  where id = seed_id;
end;
$$;

