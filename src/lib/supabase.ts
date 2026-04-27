import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://vxrjwhfgsyzdlsvneicr.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4cmp3aGZnc3l6ZGxzdm5laWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5ODU4MTIsImV4cCI6MjA5MjU2MTgxMn0.8MWprdcH4AuwnHTk3lo3dbU-HhbUtkGdAP8NEqrzHik";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type ProdutoRow = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagem: string;
  badge: string | null;
  criado_em: string;
  atualizado_em: string;
};
