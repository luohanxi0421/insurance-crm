-- RLS and birthday reminder function
-- Run in Supabase SQL editor.

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
