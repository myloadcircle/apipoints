-- AgentLayer Paywall Migration
-- Adds pricing, trial, teams, and plan enforcement

-- 1. Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS accepted_pricing boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS trial_end timestamptz DEFAULT now() + interval '14 days',
  ADD COLUMN IF NOT EXISTS team_id uuid,
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS signup_source text DEFAULT 'agentlayer';

-- 2. Plans table (Stripe-aligned)
CREATE TABLE IF NOT EXISTS public.plans (
  name text PRIMARY KEY,
  price int NOT NULL,
  included_seats int NOT NULL,
  additional_seat_price int NOT NULL DEFAULT 20,
  stripe_price_id text,
  additional_seat_stripe_price_id text DEFAULT 'price_1TUkhO3C6smqFKLaZwKZcolp',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plans"
  ON public.plans FOR SELECT
  USING (true);

-- Seed plans (Stripe-aligned)
INSERT INTO public.plans (name, price, included_seats, additional_seat_price)
VALUES
  ('starter', 199, 1, 20),
  ('growth', 499, 5, 20),
  ('enterprise', 1999, 20, 20)
ON CONFLICT (name) DO NOTHING;

-- 3. Teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text DEFAULT 'free',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own team"
  ON public.teams FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can update own team"
  ON public.teams FOR UPDATE
  USING (auth.uid() = owner_user_id);

-- 4. Team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view own membership"
  ON public.team_members FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND owner_user_id = auth.uid())
  );

CREATE POLICY "Team owner can insert members"
  ON public.team_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND owner_user_id = auth.uid())
  );

CREATE POLICY "Team owner can delete members"
  ON public.team_members FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND owner_user_id = auth.uid())
  );

-- 5. Backfill existing users (columns, teams, members)
-- Existing profiles have NULL trial_end/plan — give 30 days
UPDATE public.profiles SET
  trial_end = COALESCE(trial_end, now() + interval '30 days'),
  plan = COALESCE(plan, 'free'),
  accepted_pricing = COALESCE(accepted_pricing, false);

-- Create teams for existing profiles missing one
INSERT INTO public.teams (owner_user_id, plan)
SELECT p.id, COALESCE(p.plan, 'free')
FROM public.profiles p
WHERE p.team_id IS NULL;

-- Link team_id on profiles
UPDATE public.profiles p SET team_id = t.id
FROM public.teams t
WHERE t.owner_user_id = p.id AND p.team_id IS NULL;

-- Ensure owner is a team member
INSERT INTO public.team_members (team_id, user_id)
SELECT t.id, t.owner_user_id
FROM public.teams t
LEFT JOIN public.team_members tm ON tm.team_id = t.id AND tm.user_id = t.owner_user_id
WHERE tm.id IS NULL;

-- Mark pre-AgentLayer users (before May 2026) as loadcircle source
UPDATE public.profiles SET signup_source = 'loadcircle'
WHERE created_at < '2026-05-01' AND (signup_source IS NULL OR signup_source = 'agentlayer');

-- 6. Update handle_new_user to create team and set trial_end
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_team_id uuid;
BEGIN
  INSERT INTO public.profiles (id, email, accepted_pricing, plan, trial_end, signup_source)
  VALUES (new.id, new.email, false, 'free', now() + interval '14 days', 'agentlayer');

  INSERT INTO public.teams (owner_user_id, plan)
  VALUES (new.id, 'free')
  RETURNING id INTO v_team_id;

  INSERT INTO public.team_members (team_id, user_id)
  VALUES (v_team_id, new.id);

  UPDATE public.profiles SET team_id = v_team_id WHERE id = new.id;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: get_team_seat_count
CREATE OR REPLACE FUNCTION public.get_team_seat_count(p_team_id uuid)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT count(*)::int FROM public.team_members WHERE team_id = p_team_id);
END;
$$;

-- 8. RPC: can_add_team_member
CREATE OR REPLACE FUNCTION public.can_add_team_member(p_team_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_plan text;
  v_max_seats int;
  v_current_seats int;
BEGIN
  SELECT t.plan INTO v_plan FROM public.teams t WHERE t.id = p_team_id;
  IF v_plan = 'free' THEN RETURN false; END IF;
  SELECT included_seats INTO v_max_seats FROM public.plans WHERE name = v_plan;
  SELECT count(*) INTO v_current_seats FROM public.team_members WHERE team_id = p_team_id;
  RETURN v_current_seats < v_max_seats;
END;
$$;

-- 9. RPC: upgrade_plan
CREATE OR REPLACE FUNCTION public.upgrade_plan(p_user_id uuid, p_plan text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles SET plan = p_plan WHERE id = p_user_id;
  UPDATE public.teams SET plan = p_plan WHERE owner_user_id = p_user_id;
END;
$$;
