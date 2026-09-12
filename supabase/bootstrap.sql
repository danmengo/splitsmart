-- Snapshot of existing Supabase auth sync and RLS policies, 2026-09-12.
-- Apply after Prisma migrations when recreating the backend.
-- These are the existing policies, not a new security policy design.
-- Prisma uses a privileged database role; authorize every application API.
BEGIN;
ALTER TABLE public."expense_splits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."group_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."users" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expense_splits: group members can read" ON public."expense_splits";
CREATE POLICY "expense_splits: group members can read" ON public."expense_splits" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (expenses
     JOIN group_members ON ((group_members."groupId" = expenses."groupId")))
  WHERE ((expenses.id = expense_splits."expenseId") AND (group_members."userId" = (auth.uid())::text)))));

DROP POLICY IF EXISTS "expense_splits: split owner can update (mark paid)" ON public."expense_splits";
CREATE POLICY "expense_splits: split owner can update (mark paid)" ON public."expense_splits" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (("userId" = (auth.uid())::text));

DROP POLICY IF EXISTS "expenses: group members can add" ON public."expenses";
CREATE POLICY "expenses: group members can add" ON public."expenses" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members."groupId" = expenses."groupId") AND (group_members."userId" = (auth.uid())::text)))));

DROP POLICY IF EXISTS "expenses: group members can read" ON public."expenses";
CREATE POLICY "expenses: group members can read" ON public."expenses" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members."groupId" = expenses."groupId") AND (group_members."userId" = (auth.uid())::text)))));

DROP POLICY IF EXISTS "expenses: payer can delete" ON public."expenses";
CREATE POLICY "expenses: payer can delete" ON public."expenses" AS PERMISSIVE FOR DELETE TO "authenticated" USING (("paidById" = (auth.uid())::text));

DROP POLICY IF EXISTS "expenses: payer can update" ON public."expenses";
CREATE POLICY "expenses: payer can update" ON public."expenses" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (("paidById" = (auth.uid())::text));

DROP POLICY IF EXISTS "group_members: admins can insert" ON public."group_members";
CREATE POLICY "group_members: admins can insert" ON public."group_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM group_members gm
  WHERE ((gm."groupId" = group_members."groupId") AND (gm."userId" = (auth.uid())::text) AND (gm.role = 'admin'::text)))));

DROP POLICY IF EXISTS "group_members: admins can remove, members can leave" ON public."group_members";
CREATE POLICY "group_members: admins can remove, members can leave" ON public."group_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((("userId" = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM group_members gm
  WHERE ((gm."groupId" = group_members."groupId") AND (gm."userId" = (auth.uid())::text) AND (gm.role = 'admin'::text))))));

DROP POLICY IF EXISTS "group_members: admins can update roles" ON public."group_members";
CREATE POLICY "group_members: admins can update roles" ON public."group_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM group_members gm
  WHERE ((gm."groupId" = group_members."groupId") AND (gm."userId" = (auth.uid())::text) AND (gm.role = 'admin'::text)))));

DROP POLICY IF EXISTS "group_members: members can read" ON public."group_members";
CREATE POLICY "group_members: members can read" ON public."group_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM group_members gm
  WHERE ((gm."groupId" = group_members."groupId") AND (gm."userId" = (auth.uid())::text)))));

DROP POLICY IF EXISTS "groups: admins can delete" ON public."groups";
CREATE POLICY "groups: admins can delete" ON public."groups" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members."groupId" = groups.id) AND (group_members."userId" = (auth.uid())::text) AND (group_members.role = 'admin'::text)))));

DROP POLICY IF EXISTS "groups: admins can update" ON public."groups";
CREATE POLICY "groups: admins can update" ON public."groups" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members."groupId" = groups.id) AND (group_members."userId" = (auth.uid())::text) AND (group_members.role = 'admin'::text)))));

DROP POLICY IF EXISTS "groups: authenticated can create" ON public."groups";
CREATE POLICY "groups: authenticated can create" ON public."groups" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((auth.uid())::text = "createdBy"));

DROP POLICY IF EXISTS "groups: members can read" ON public."groups";
CREATE POLICY "groups: members can read" ON public."groups" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members."groupId" = groups.id) AND (group_members."userId" = (auth.uid())::text)))));

DROP POLICY IF EXISTS "notifications: users delete own" ON public."notifications";
CREATE POLICY "notifications: users delete own" ON public."notifications" AS PERMISSIVE FOR DELETE TO "authenticated" USING (("userId" = (auth.uid())::text));

DROP POLICY IF EXISTS "notifications: users read own" ON public."notifications";
CREATE POLICY "notifications: users read own" ON public."notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING (("userId" = (auth.uid())::text));

DROP POLICY IF EXISTS "notifications: users update own (mark read)" ON public."notifications";
CREATE POLICY "notifications: users update own (mark read)" ON public."notifications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (("userId" = (auth.uid())::text));

DROP POLICY IF EXISTS "users: authenticated can read all" ON public."users";
CREATE POLICY "users: authenticated can read all" ON public."users" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);

DROP POLICY IF EXISTS "users: can update own profile" ON public."users";
CREATE POLICY "users: can update own profile" ON public."users" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((auth.uid())::text = id));

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$function$
;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
COMMIT;
