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

-- Table for logging API collaboration details
create table if not exists api_collaboration_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  session_id text,
  workflow_type text not null,
  api1_used boolean default false,
  api2_used boolean default false,
  vector_api_used boolean default false,
  seed_generated boolean default false,
  secondary_analysis boolean default false,
  processing_time_ms integer,
  success boolean default false,
  error_details jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Function to log workflow results
create or replace function log_evai_workflow(
  p_user_id uuid,
  p_conversation_id text,
  p_workflow_type text,
  p_api_collaboration jsonb,
  p_rubrics_data jsonb default null,
  p_processing_time integer default null,
  p_success boolean default true,
  p_error_details jsonb default null
) returns uuid
language plpgsql
as $$
declare
  new_log_id uuid;
begin
  insert into api_collaboration_logs (
    user_id,
    session_id,
    workflow_type,
    api1_used,
    api2_used,
    vector_api_used,
    seed_generated,
    secondary_analysis,
    processing_time_ms,
    success,
    error_details,
    metadata
  ) values (
    p_user_id,
    p_conversation_id,
    p_workflow_type,
    coalesce((p_api_collaboration->>'api1Used')::boolean, false),
    coalesce((p_api_collaboration->>'api2Used')::boolean, false),
    coalesce((p_api_collaboration->>'vectorApiUsed')::boolean, false),
    coalesce((p_api_collaboration->>'seedGenerated')::boolean, false),
    coalesce((p_api_collaboration->>'secondaryAnalysis')::boolean, false),
    p_processing_time,
    p_success,
    p_error_details,
    coalesce(p_rubrics_data, '{}'::jsonb)
  ) returning id into new_log_id;

  return new_log_id;
end;
$$;

-- Function to increment usage count and update timestamp
create or replace function increment_seed_usage(seed_id uuid)
returns void
language plpgsql
as $$
begin
  update emotion_seeds
  set meta = jsonb_set(
        coalesce(meta, '{}'::jsonb),
        '{usageCount}',
        to_jsonb(coalesce((meta->>'usageCount')::int, 0) + 1),
        true
      ),
      updated_at = now()
  where id = seed_id;
end;
$$;
