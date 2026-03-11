// Demo mode: siempre autenticado, sin OAuth

const DEMO_USER = {
  id: 1,
  openId: "demo-user-001",
  name: "Instalador Demo",
  email: "demo@certia.io",
  loginMethod: "demo",
  role: "user" as const,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  lastSignedIn: new Date(),
};

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(_options?: UseAuthOptions) {
  return {
    user: DEMO_USER,
    loading: false,
    error: null,
    isAuthenticated: true,
    refresh: () => {},
    logout: async () => {},
  };
}
