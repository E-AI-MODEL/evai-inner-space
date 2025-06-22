-- Schema export combining baseline and migrations

-- Table: emotion_seeds
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

-- Table: seed_feedback
create table if not exists seed_feedback (
  id uuid primary key default uuid_generate_v4(),
  seed_id uuid references emotion_seeds(id),
  user_id uuid references auth.users,
  rating text,
  notes text,
  created_at timestamptz default now()
);

-- Table: seed_rubrics
create table if not exists seed_rubrics (
  id uuid primary key default uuid_generate_v4(),
  seed_id uuid references emotion_seeds(id),
  rubric text,
  score float,
  created_at timestamptz default now()
);

-- Table: rubrics
create table if not exists rubrics (
  id uuid primary key default uuid_generate_v4(),
  code text unique,
  rubric_json jsonb
);

-- Table: settings
create table if not exists settings (
  id uuid primary key default uuid_generate_v4(),
  key text not null,
  value text not null,
  user_id uuid references auth.users on delete cascade,
  updated_at timestamptz default now(),
  unique(key, user_id)
);

-- Table: vector_embeddings
create table if not exists vector_embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  content_id uuid not null,
  content_type text not null check (content_type in ('seed','message','conversation')),
  content_text text not null,
  embedding vector(1536),
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists vector_embeddings_embedding_idx on vector_embeddings using ivfflat (embedding vector_cosine_ops);

-- Table: decision_logs
create table if not exists decision_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  user_input text not null,
  symbolic_matches jsonb default '[]',
  neural_similarities jsonb default '[]',
  hybrid_decision jsonb not null,
  final_response text not null,
  confidence_score double precision not null,
  processing_time_ms integer,
  conversation_id text,
  workflow_version text default '5.6',
  api_collaboration jsonb default '{}',
  rubrics_analysis jsonb default '{}',
  created_at timestamptz default now()
);
create index if not exists idx_decision_logs_conversation_id on decision_logs(conversation_id);

-- Table: reflection_logs
create table if not exists reflection_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  trigger_type text not null check (trigger_type in ('feedback','pattern','error','improvement')),
  context jsonb not null,
  insights jsonb default '[]',
  actions_taken jsonb default '[]',
  new_seeds_generated integer default 0,
  learning_impact double precision default 0.0,
  created_at timestamptz default now()
);

-- Table: profiles
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table: rubrics_assessments
create table if not exists rubrics_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  conversation_id text,
  message_content text not null,
  rubric_id text not null,
  risk_score double precision default 0,
  protective_score double precision default 0,
  overall_score double precision default 0,
  triggers jsonb default '[]'::jsonb,
  confidence_level text default 'medium',
  processing_mode text default 'flexible',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_rubrics_assessments_user_id on rubrics_assessments(user_id);
create index if not exists idx_rubrics_assessments_conversation_id on rubrics_assessments(conversation_id);

-- Table: api_collaboration_logs
create table if not exists api_collaboration_logs (
  id uuid primary key default gen_random_uuid(),
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
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
create index if not exists idx_api_collaboration_logs_user_id on api_collaboration_logs(user_id);
create index if not exists idx_api_collaboration_logs_session_id on api_collaboration_logs(session_id);

-- Functions

-- increment_seed_usage updates metadata and timestamp
create or replace function increment_seed_usage(seed_id uuid)
returns void
language plpgsql as $$
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

-- get_setting retrieves a setting by key with optional default
create or replace function get_setting(setting_key text, default_value text default null)
returns text
language plpgsql security definer as $$
declare setting_value text;
begin
  select value into setting_value from settings where key = setting_key;
  if setting_value is null then
    return default_value;
  end if;
  return setting_value;
end;
$$;

-- update_setting inserts or updates a setting by key
create or replace function update_setting(setting_key text, setting_value text)
returns void
language plpgsql security definer as $$
begin
  insert into settings(key, value, updated_at)
  values(setting_key, setting_value, now())
  on conflict (key)
  do update set value = excluded.value, updated_at = excluded.updated_at;
end;
$$;

-- find_similar_embeddings returns embeddings above a similarity threshold
create or replace function find_similar_embeddings(
  query_embedding vector(1536),
  similarity_threshold double precision default 0.7,
  max_results integer default 10
) returns table(
  content_id uuid,
  content_type text,
  content_text text,
  similarity_score double precision,
  metadata jsonb
) language plpgsql as $$
begin
  return query
  select
    ve.content_id,
    ve.content_type,
    ve.content_text,
    1 - (ve.embedding <=> query_embedding) as similarity_score,
    ve.metadata
  from vector_embeddings ve
  where 1 - (ve.embedding <=> query_embedding) > similarity_threshold
  order by ve.embedding <=> query_embedding
  limit max_results;
end;
$$;

-- log_hybrid_decision stores decision engine details
create or replace function log_hybrid_decision(
  p_user_input text,
  p_symbolic_matches jsonb,
  p_neural_similarities jsonb,
  p_hybrid_decision jsonb,
  p_final_response text,
  p_confidence_score double precision,
  p_processing_time_ms integer default null,
  p_user_id uuid default null
) returns uuid language plpgsql as $$
declare decision_id uuid;
begin
  insert into decision_logs (
    user_input,
    symbolic_matches,
    neural_similarities,
    hybrid_decision,
    final_response,
    confidence_score,
    processing_time_ms,
    user_id
  ) values (
    p_user_input,
    p_symbolic_matches,
    p_neural_similarities,
    p_hybrid_decision,
    p_final_response,
    p_confidence_score,
    p_processing_time_ms,
    p_user_id
  ) returning id into decision_id;
  return decision_id;
end;
$$;

-- handle_new_user creates a profile on signup
create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into profiles(id, email, full_name)
  values(new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure handle_new_user();

-- get_user_setting returns a user's setting value
create or replace function get_user_setting(setting_key text, default_value text default null)
returns text language plpgsql security definer set search_path = '' as $$
begin
  return (
    select value from settings
    where key = setting_key
      and user_id = auth.uid()
    limit 1
  );
end;
$$;

-- update_user_setting saves a user's setting value
create or replace function update_user_setting(setting_key text, setting_value text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into settings(key, value, user_id)
  values(setting_key, setting_value, auth.uid())
  on conflict (key, user_id)
  do update set value = excluded.value, updated_at = now();
end;
$$;

-- log_evai_workflow tracks API collaboration
create or replace function log_evai_workflow(
  p_user_id uuid,
  p_conversation_id text,
  p_workflow_type text,
  p_api_collaboration jsonb,
  p_rubrics_data jsonb default null,
  p_processing_time integer default null,
  p_success boolean default true,
  p_error_details jsonb default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare new_log_id uuid;
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

-- Indexes already defined above for embeddings, assessments, collaboration logs and decision logs

-- Row level security policies
alter table emotion_seeds enable row level security;
create policy "Everyone can view active emotion seeds" on emotion_seeds
  for select using (active = true);

alter table seed_feedback enable row level security;
create policy "Users can view own feedback" on seed_feedback
  for select using (auth.uid() = user_id);
create policy "Users can create own feedback" on seed_feedback
  for insert with check (auth.uid() = user_id);

alter table seed_rubrics enable row level security;
create policy "Everyone can view seed rubrics" on seed_rubrics
  for select using (true);

alter table rubrics enable row level security;
create policy "Everyone can view rubrics" on rubrics
  for select using (true);

alter table settings enable row level security;
create policy "Users can view own settings" on settings
  for select using (auth.uid() = user_id);
create policy "Users can insert own settings" on settings
  for insert with check (auth.uid() = user_id);
create policy "Users can update own settings" on settings
  for update using (auth.uid() = user_id);
create policy "Users can delete own settings" on settings
  for delete using (auth.uid() = user_id);

alter table vector_embeddings enable row level security;
create policy "Users can view own embeddings" on vector_embeddings
  for select using (auth.uid() = user_id);
create policy "Users can create own embeddings" on vector_embeddings
  for insert with check (auth.uid() = user_id);

alter table decision_logs enable row level security;
create policy "Users can view own decisions" on decision_logs
  for select using (auth.uid() = user_id);
create policy "Users can create own decisions" on decision_logs
  for insert with check (auth.uid() = user_id);

alter table reflection_logs enable row level security;
create policy "Users can view own reflections" on reflection_logs
  for select using (auth.uid() = user_id);
create policy "Users can create own reflections" on reflection_logs
  for insert with check (auth.uid() = user_id);

alter table profiles enable row level security;
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

alter table rubrics_assessments enable row level security;
create policy "Users can view their own rubrics assessments" on rubrics_assessments
  for select using (auth.uid() = user_id);
create policy "Users can insert their own rubrics assessments" on rubrics_assessments
  for insert with check (auth.uid() = user_id);

alter table api_collaboration_logs enable row level security;
create policy "Users can view their own API collaboration logs" on api_collaboration_logs
  for select using (auth.uid() = user_id);
create policy "Users can insert their own API collaboration logs" on api_collaboration_logs
  for insert with check (auth.uid() = user_id);

