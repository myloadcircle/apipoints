-- AgentLayer Dashboard Modules Migration
-- Executes all schema changes for modules 1-5

-- 1. API Key Scopes
alter table public.api_keys add column if not exists scope text not null default 'full';

-- 2. Agent Usage table
create table if not exists public.agent_usage (
  id bigint generated always as identity primary key,
  agent_id uuid not null,
  user_id uuid not null,
  requests int default 0,
  tokens int default 0,
  cost numeric default 0,
  created_at timestamp default now()
);

alter table public.agent_usage enable row level security;

create policy "Users can view own agent usage"
  on public.agent_usage for select
  using (auth.uid() = user_id);

create policy "Users can insert own agent usage"
  on public.agent_usage for insert
  with check (auth.uid() = user_id);

-- 3. Workflow Runs table
create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  agent_id uuid,
  agent_name text,
  input jsonb,
  output jsonb,
  steps jsonb,
  status text default 'pending',
  duration_ms int,
  created_at timestamp default now()
);

alter table public.workflow_runs enable row level security;

create policy "Users can view own workflow runs"
  on public.workflow_runs for select
  using (auth.uid() = user_id);

create policy "Users can insert own workflow runs"
  on public.workflow_runs for insert
  with check (auth.uid() = user_id);

-- 4. Agents table
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  system_prompt text,
  model text,
  temperature numeric,
  tools jsonb,
  created_at timestamp default now()
);

alter table public.agents enable row level security;

create policy "Users can view own agents"
  on public.agents for select
  using (auth.uid() = user_id);

create policy "Users can insert own agents"
  on public.agents for insert
  with check (auth.uid() = user_id);

create policy "Users can update own agents"
  on public.agents for update
  using (auth.uid() = user_id);

create policy "Users can delete own agents"
  on public.agents for delete
  using (auth.uid() = user_id);

-- 5. RPC: get_agent_usage
create or replace function public.get_agent_usage(p_user_id uuid)
returns table(agent_id uuid, agent_name text, requests bigint, tokens bigint, cost numeric, last_used timestamptz)
language plpgsql security definer
as $$
begin
  return query
  select
    au.agent_id,
    coalesce(a.name, 'Unknown') as agent_name,
    coalesce(sum(au.requests), 0)::bigint as requests,
    coalesce(sum(au.tokens), 0)::bigint as tokens,
    coalesce(sum(au.cost), 0)::numeric as cost,
    max(au.created_at)::timestamptz as last_used
  from agent_usage au
  left join agents a on a.id = au.agent_id
  where au.user_id = p_user_id
  group by au.agent_id, a.name
  order by last_used desc nulls last;
end;
$$;

-- 6. RPC: run_agent
create or replace function public.run_agent(p_agent_id uuid, p_input text)
returns jsonb
language plpgsql security definer
as $$
declare
  v_agent agents;
  v_output jsonb;
  v_run_id uuid;
  v_duration int;
  v_tokens int;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_agent from agents where id = p_agent_id and user_id = v_user_id;
  if not found then
    raise exception 'Agent not found';
  end if;

  v_duration := floor(random() * 2000 + 200)::int;
  v_tokens := floor(random() * 500 + 100)::int;
  v_run_id := gen_random_uuid();
  v_output := jsonb_build_object(
    'result', 'Agent execution completed',
    'agent', v_agent.name,
    'model', v_agent.model,
    'response', 'Simulated response for: ' || p_input,
    'tokens_used', v_tokens,
    'duration_ms', v_duration
  );

  insert into workflow_runs (id, user_id, agent_id, agent_name, input, output, status, duration_ms)
  values (v_run_id, v_user_id, p_agent_id, v_agent.name, to_jsonb(p_input), v_output, 'completed', v_duration);

  insert into agent_usage (agent_id, user_id, requests, tokens, cost)
  values (p_agent_id, v_user_id, 1, v_tokens, v_tokens * 0.00001);

  return jsonb_build_object(
    'run_id', v_run_id,
    'output', v_output,
    'status', 'completed'
  );
end;
$$;

-- 7. RPC: list_user_agents
create or replace function public.list_user_agents(p_user_id uuid)
returns setof agents
language plpgsql security definer
as $$
begin
  return query
  select *
  from agents
  where user_id = p_user_id
  order by created_at desc;
end;
$$;
