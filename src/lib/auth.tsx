import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "teacher" | "student";

type AuthCtx = {
  session: Session | null;
  ready: boolean;
  userId: string | null;
  roles: Role[];
  isAdmin: boolean;
  isTeacher: boolean;
  isStaff: boolean;
  perms: { can_create_exams: boolean; can_publish_results: boolean };
  refresh: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_IN" || event === "USER_UPDATED") qc.invalidateQueries();
      if (event === "SIGNED_OUT") qc.clear();
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);

  const userId = session?.user.id ?? null;
  const rolesQ = useQuery({
    queryKey: ["my-roles", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ data: r }, { data: p }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId!),
        supabase.from("staff_permissions").select("*").eq("user_id", userId!).maybeSingle(),
      ]);
      return { roles: (r ?? []).map((x) => x.role as Role), perms: p };
    },
  });
  const roles = rolesQ.data?.roles ?? [];
  const isAdmin = roles.includes("admin");
  const isTeacher = roles.includes("teacher");
  const value: AuthCtx = {
    session,
    ready: ready && (!userId || !rolesQ.isLoading),
    userId,
    roles,
    isAdmin,
    isTeacher,
    isStaff: isAdmin || isTeacher,
    perms: {
      can_create_exams: isAdmin || !!rolesQ.data?.perms?.can_create_exams,
      can_publish_results: isAdmin || !!rolesQ.data?.perms?.can_publish_results,
    },
    refresh: () => rolesQ.refetch(),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}
