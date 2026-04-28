import { create } from "zustand";

export type AuthState = {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

// Verifica localStorage na inicialização
const storedAuth =
  typeof window !== "undefined" && localStorage.getItem("gela_auth") === "true";

export const useAuth = create<AuthState>((set) => ({
  isAuthenticated: storedAuth,
  login: (username: string, password: string) => {
    // Credenciais hardcoded — em produção usar backend seguro
    if (username === "gelaredenção" && password === "gela@345") {
      set({ isAuthenticated: true });
      localStorage.setItem("gela_auth", "true");
      return true;
    }
    return false;
  },
  logout: () => {
    set({ isAuthenticated: false });
    localStorage.removeItem("gela_auth");
  },
}));
