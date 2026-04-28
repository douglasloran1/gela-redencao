// Store de produtos — sincronizado com Supabase
// Leitura: loja pública | Escrita: dashboard autenticado
// Realtime: atualiza automaticamente em todos os clientes conectados

import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export type Produto = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagem: string;
  badge?: string;
};

type ProdutosStore = {
  produtos: Produto[];
  categorias: string[];
  carregando: boolean;
  erro: string | null;
  carregar: () => Promise<void>;
  adicionar: (p: Omit<Produto, "id">) => Promise<void>;
  editar: (p: Produto) => Promise<void>;
  excluir: (id: string) => Promise<void>;
  iniciarRealtime: () => () => void;
};

function calcCategorias(lista: Produto[]) {
  return ["Todos", ...Array.from(new Set(lista.map((p) => p.categoria)))];
}

function rowToProduto(r: Record<string, unknown>): Produto {
  return {
    id: r.id as string,
    nome: r.nome as string,
    descricao: (r.descricao as string) ?? "",
    preco: Number(r.preco),
    categoria: r.categoria as string,
    imagem: (r.imagem as string) ?? "",
    badge: (r.badge as string) ?? undefined,
  };
}

export const useProdutos = create<ProdutosStore>((set, get) => ({
  produtos: [],
  categorias: ["Todos"],
  carregando: false,
  erro: null,

  // ── Carregar do Supabase ──────────────────────────────────────────────────
  carregar: async () => {
    set({ carregando: true, erro: null });
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .order("criado_em", { ascending: true });

      if (error) throw error;

      const lista: Produto[] = (data ?? []).map(rowToProduto);
      set({ produtos: lista, categorias: calcCategorias(lista), carregando: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar produtos";
      set({ erro: msg, carregando: false });
    }
  },

  // ── Realtime — escuta INSERT / UPDATE / DELETE do Supabase ────────────────
  iniciarRealtime: () => {
    const channel = supabase
      .channel("produtos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "produtos" },
        () => {
          // Sempre recarrega do banco para garantir consistência
          get().carregar();
        }
      )
      .subscribe();

    // Retorna função de cleanup para cancelar a subscription
    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ── Adicionar ─────────────────────────────────────────────────────────────
  adicionar: async (p) => {
    const { error } = await supabase
      .from("produtos")
      .insert({
        nome: p.nome,
        descricao: p.descricao,
        preco: p.preco,
        categoria: p.categoria,
        imagem: p.imagem,
        badge: p.badge ?? null,
      });

    if (error) throw new Error(error.message);
    // O realtime vai detectar o INSERT e chamar carregar() automaticamente
  },

  // ── Editar ────────────────────────────────────────────────────────────────
  editar: async (p) => {
    const { error } = await supabase
      .from("produtos")
      .update({
        nome: p.nome,
        descricao: p.descricao,
        preco: p.preco,
        categoria: p.categoria,
        imagem: p.imagem,
        badge: p.badge ?? null,
      })
      .eq("id", p.id);

    if (error) throw new Error(error.message);
    // O realtime vai detectar o UPDATE e chamar carregar() automaticamente
  },

  // ── Excluir ───────────────────────────────────────────────────────────────
  excluir: async (id) => {
    const { error } = await supabase
      .from("produtos")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
    // O realtime vai detectar o DELETE e chamar carregar() automaticamente
  },
}));