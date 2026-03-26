-- insurance-crm Supabase initialization script (latest)
-- Includes: extensions, tables, indexes, triggers, RLS, policies, birthday reminder function.
-- Safe to run multiple times (uses IF NOT EXISTS / DROP IF EXISTS where possible).

BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===== Tables =====

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  gender text CHECK (gender IN ('male', 'female') OR gender IS NULL),
  phone text,
  birth_date date,
  birthday_type text NOT NULL DEFAULT 'solar' CHECK (birthday_type IN ('solar', 'lunar')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Remove legacy lunar fields (no longer used by app)
ALTER TABLE IF EXISTS public.clients DROP COLUMN IF EXISTS lunar_birthday_month;
ALTER TABLE IF EXISTS public.clients DROP COLUMN IF EXISTS lunar_birthday_day;

CREATE TABLE IF NOT EXISTS public.blood_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  related_person_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  relation_type text NOT NULL CHECK (relation_type IN ('father', 'mother')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blood_relationships_not_self CHECK (person_id <> related_person_id)
);

CREATE TABLE IF NOT EXISTS public.spouse_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  male_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  female_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  relation_type text NOT NULL CHECK (relation_type IN ('spouse', 'cohabiting')),
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT spouse_relationships_not_self CHECK (male_id <> female_id)
);

CREATE TABLE IF NOT EXISTS public.visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  visit_date timestamptz NOT NULL DEFAULT now(),
  content text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visit_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  gift_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(12, 2),
  delivery_type text NOT NULL CHECK (delivery_type IN ('in_person', 'mailed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Indexes =====
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_birth_date ON public.clients(birth_date);
CREATE INDEX IF NOT EXISTS idx_blood_relationships_person_id ON public.blood_relationships(person_id);
CREATE INDEX IF NOT EXISTS idx_blood_relationships_related_person_id ON public.blood_relationships(related_person_id);
CREATE INDEX IF NOT EXISTS idx_spouse_relationships_male_id ON public.spouse_relationships(male_id);
CREATE INDEX IF NOT EXISTS idx_spouse_relationships_female_id ON public.spouse_relationships(female_id);
CREATE INDEX IF NOT EXISTS idx_visits_client_id ON public.visits(client_id);
CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON public.visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_visit_gifts_visit_id ON public.visit_gifts(visit_id);

-- ===== updated_at trigger for clients =====
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clients_set_updated_at ON public.clients;
CREATE TRIGGER trg_clients_set_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ===== RLS =====
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blood_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.spouse_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.visit_gifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clients_select_own ON public.clients;
CREATE POLICY clients_select_own ON public.clients
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS clients_insert_own ON public.clients;
CREATE POLICY clients_insert_own ON public.clients
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS clients_update_own ON public.clients;
CREATE POLICY clients_update_own ON public.clients
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS clients_delete_own ON public.clients;
CREATE POLICY clients_delete_own ON public.clients
FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS blood_relationships_all_own ON public.blood_relationships;
CREATE POLICY blood_relationships_all_own ON public.blood_relationships
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = blood_relationships.person_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = blood_relationships.person_id
      AND c.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = blood_relationships.related_person_id
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS spouse_relationships_all_own ON public.spouse_relationships;
CREATE POLICY spouse_relationships_all_own ON public.spouse_relationships
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id IN (spouse_relationships.male_id, spouse_relationships.female_id)
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.clients c1
    WHERE c1.id = spouse_relationships.male_id
      AND c1.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.clients c2
    WHERE c2.id = spouse_relationships.female_id
      AND c2.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS visits_all_own ON public.visits;
CREATE POLICY visits_all_own ON public.visits
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = visits.client_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = visits.client_id
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS visit_gifts_all_own ON public.visit_gifts;
CREATE POLICY visit_gifts_all_own ON public.visit_gifts
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.visits v
    JOIN public.clients c ON c.id = v.client_id
    WHERE v.id = visit_gifts.visit_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.visits v
    JOIN public.clients c ON c.id = v.client_id
    WHERE v.id = visit_gifts.visit_id
      AND c.user_id = auth.uid()
  )
);

-- ===== Birthday reminder function =====
DROP FUNCTION IF EXISTS public.get_upcoming_birthdays(uuid, integer);
CREATE OR REPLACE FUNCTION public.get_upcoming_birthdays(
  p_user_id uuid,
  p_days integer DEFAULT 7
)
RETURNS TABLE (
  client_id uuid,
  name text,
  birth_date date,
  days_until integer,
  birthday_type text
)
LANGUAGE sql
STABLE
AS $$
  WITH base AS (
    SELECT
      c.id AS client_id,
      c.name,
      c.birth_date::date AS birth_date,
      c.birthday_type,
      make_date(
        EXTRACT(YEAR FROM current_date)::int,
        EXTRACT(MONTH FROM c.birth_date)::int,
        EXTRACT(DAY FROM c.birth_date)::int
      ) AS this_year_birthday
    FROM public.clients c
    WHERE c.user_id = p_user_id
      AND c.birth_date IS NOT NULL
      AND c.birthday_type = 'solar'
  ), normalized AS (
    SELECT
      client_id,
      name,
      birth_date,
      birthday_type,
      CASE
        WHEN this_year_birthday < current_date
          THEN (this_year_birthday + interval '1 year')::date
        ELSE this_year_birthday::date
      END AS next_birthday
    FROM base
  )
  SELECT
    client_id,
    name,
    birth_date,
    (next_birthday - current_date)::int AS days_until,
    birthday_type
  FROM normalized
  WHERE (next_birthday - current_date)::int BETWEEN 0 AND p_days
  ORDER BY days_until, name;
$$;

GRANT EXECUTE ON FUNCTION public.get_upcoming_birthdays(uuid, integer) TO authenticated;

COMMIT;
