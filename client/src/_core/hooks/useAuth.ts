import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading, error, refetch } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
  });
  const logoutMutation = trpc.auth.logout.useMutation();

  const isAuthenticated = !!user;

  useEffect(() => {
    if (!isLoading && !isAuthenticated && options?.redirectOnUnauthenticated) {
      setLocation(options.redirectPath ?? "/auth");
    }
  }, [isLoading, isAuthenticated, options?.redirectOnUnauthenticated, options?.redirectPath]);

  const logout = async () => {
    await logoutMutation.mutateAsync();
    setLocation("/auth");
  };

  return {
    user: user ?? null,
    loading: isLoading,
    error: error ?? null,
    isAuthenticated,
    refresh: refetch,
    logout,
  };
}
