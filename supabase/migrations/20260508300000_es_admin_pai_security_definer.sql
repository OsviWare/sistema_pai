-- Evita recursión infinita en RLS: es_admin_pai() lee usuarios_perfil, y la política SELECT
-- de esa tabla vuelve a llamar es_admin_pai() → "stack depth limit exceeded".
-- SECURITY DEFINER ejecuta la subconsulta con privilegios del owner (bypass RLS).

CREATE OR REPLACE FUNCTION public.es_admin_pai()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(auth.jwt() ->> 'user_role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.usuarios_perfil u
      WHERE u.id = auth.uid()
        AND u.rol = 'admin'
    );
$$;

COMMENT ON FUNCTION public.es_admin_pai() IS
  'Admin PAI vía JWT user_role o fila en usuarios_perfil. SECURITY DEFINER para no re-encadenar RLS.';

REVOKE ALL ON FUNCTION public.es_admin_pai() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.es_admin_pai() TO authenticated;
