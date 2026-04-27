// Store de banners do carrossel — sincronizado com Supabase
// Realtime: atualiza automaticamente em todos os clientes conectados

import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export type Banner = {
  id: string;
  imagem: string;
  titulo?: string;
  subtitulo?: string;
  ordem: number;
  ativo: boolean;
};

type BannersStore = {
  banners: Banner[];
  carregando: boolean;
  erro: string | null;
  carregar: () => Promise<void>;
  adicionar: (b: Omit<Banner, "id">) => Promise<void>;
  editar: (b: Banner) => Promise<void>;
  excluir: (id: string) => Promise<void>;
  iniciarRealtime: () => () => void;
};

function rowToBanner(r: Record<string, unknown>): Banner {
  return {
    id: r.id as string,
    imagem: (r.imagem as string) ?? "",
    titulo: (r.titulo as string) ?? "",
    subtitulo: (r.subtitulo as string) ?? "",
    ordem: (r.ordem as number) ?? 0,
    ativo: (r.ativo as boolean) ?? true,
  };
}

export const useBanners = create<BannersStore>((set, get) => ({
  banners: [],
  carregando: false,
  erro: null,

  carregar: async () => {
    set({ carregando: true, erro: null });
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("ordem", { ascending: true });

      if (error) throw error;

      const lista: Banner[] = (data ?? []).map(rowToBanner);
      set({ banners: lista, carregando: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar banners";
      set({ erro: msg, carregando: false });
    }
  },

  // ── Realtime — escuta INSERT / UPDATE / DELETE do Supabase ────────────────
  iniciarRealtime: () => {
    const channel = supabase
      .channel("banners-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "banners" },
        (payload) => {
          const { eventType, new: novo, old } = payload;
          const { banners } = get();

          if (eventType === "INSERT") {
            const item = rowToBanner(novo as Record<string, unknown>);
            if (banners.some((b) => b.id === item.id)) return;
            const lista = [...banners, item].sort((a, b) => a.ordem - b.ordem);
            set({ banners: lista });
          }

          if (eventType === "UPDATE") {
            const item = rowToBanner(novo as Record<string, unknown>);
            const lista = banners
              .map((b) => (b.id === item.id ? item : b))
              .sort((a, b) => a.ordem - b.ordem);
            set({ banners: lista });
          }

          if (eventType === "DELETE") {
            const id = (old as Record<string, unknown>).id as string;
            set({ banners: banners.filter((b) => b.id !== id) });
          }
        }
      )
      .subscribe();

    // Retorna função de cleanup para cancelar a subscription
    return () => {
      supabase.removeChannel(channel);
    };
  },

  adicionar: async (b) => {
    const novoId = Date.now().toString();
    const { data, error } = await supabase
      .from("banners")
      .insert({
        id: novoId,
        imagem: b.imagem,
        titulo: b.titulo ?? "",
        subtitulo: b.subtitulo ?? "",
        ordem: b.ordem,
        ativo: b.ativo,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const novo: Banner = rowToBanner(data as Record<string, unknown>);
    const lista = [...get().banners, novo].sort((a, b) => a.ordem - b.ordem);
    set({ banners: lista });
  },

  editar: async (b) => {
    const { error } = await supabase
      .from("banners")
      .update({
        imagem: b.imagem,
        titulo: b.titulo ?? "",
        subtitulo: b.subtitulo ?? "",
        ordem: b.ordem,
        ativo: b.ativo,
      })
      .eq("id", b.id);

    if (error) throw new Error(error.message);

    const lista = get().banners
      .map((x) => (x.id === b.id ? b : x))
      .sort((a, b) => a.ordem - b.ordem);
    set({ banners: lista });
  },

  excluir: async (id) => {
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) throw new Error(error.message);
    set({ banners: get().banners.filter((x) => x.id !== id) });
  },
}));
