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
