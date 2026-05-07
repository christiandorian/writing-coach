-- Prompts
create table prompts (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  category text not null, -- general | business | policy | ethics | case_study
  created_at timestamptz default now()
);

-- Sessions
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  prompt_id uuid references prompts(id),
  prompt_text text not null,
  position text not null,
  response_v1 text not null,
  response_v2 text,
  time_taken_seconds integer,
  time_limit_seconds integer,
  status text default 'complete',
  created_at timestamptz default now()
);

-- Feedback
create table feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id),
  version integer not null default 1,
  position_clarity_score integer,
  position_clarity_diagnosis text,
  position_clarity_suggestion text,
  argument_structure_score integer,
  argument_structure_diagnosis text,
  argument_structure_suggestion text,
  logical_consistency_score integer,
  logical_consistency_diagnosis text,
  logical_consistency_suggestion text,
  use_of_evidence_score integer,
  use_of_evidence_diagnosis text,
  use_of_evidence_suggestion text,
  tradeoff_awareness_score integer,
  tradeoff_awareness_diagnosis text,
  tradeoff_awareness_suggestion text,
  overall_score numeric(4,2),
  coach_note text,
  created_at timestamptz default now()
);

-- RLS Policies
alter table sessions enable row level security;
alter table feedback enable row level security;
alter table prompts enable row level security;

-- Sessions: users can only see their own
create policy "Users can view own sessions"
  on sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on sessions for update
  using (auth.uid() = user_id);

-- Feedback: users can see feedback for their sessions
create policy "Users can view own feedback"
  on feedback for select
  using (
    exists (
      select 1 from sessions
      where sessions.id = feedback.session_id
      and sessions.user_id = auth.uid()
    )
  );

create policy "Users can insert own feedback"
  on feedback for insert
  with check (
    exists (
      select 1 from sessions
      where sessions.id = feedback.session_id
      and sessions.user_id = auth.uid()
    )
  );

-- Prompts: publicly readable
create policy "Prompts are publicly readable"
  on prompts for select
  using (true);
