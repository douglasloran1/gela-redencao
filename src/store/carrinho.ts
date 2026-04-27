import { create } from "zustand";
import { Produto } from "@/store/produtos";

export type ItemCarrinho = Produto & { quantidade: number };

export type DadosCheckout = {
  nome: string;
  telefone: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  referencia: string;
  formaPagamento: string;
  troco: string;
};

type CarrinhoStore = {
  itens: ItemCarrinho[];
  dadosCheckout: DadosCheckout | null;
  adicionar: (p: Produto) => void;
  remover: (id: string) => void;
  alterarQtd: (id: string, qtd: number) => void;
  limpar: () => void;
  total: () => number;
  qtdTotal: () => number;
  setDadosCheckout: (d: DadosCheckout) => void;
};

export const useCarrinho = create<CarrinhoStore>((set, get) => ({
  itens: [],
  dadosCheckout: null,
  adicionar: (p) =>
    set((s) => {
      const existe = s.itens.find((i) => i.id === p.id);
      if (existe) {
        return { itens: s.itens.map((i) => (i.id === p.id ? { ...i, quantidade: i.quantidade + 1 } : i)) };
      }
      return { itens: [...s.itens, { ...p, quantidade: 1 }] };
    }),
  remover: (id) => set((s) => ({ itens: s.itens.filter((i) => i.id !== id) })),
  alterarQtd: (id, qtd) =>
    set((s) => ({
      itens: qtd <= 0 ? s.itens.filter((i) => i.id !== id) : s.itens.map((i) => (i.id === id ? { ...i, quantidade: qtd } : i)),
    })),
  limpar: () => set({ itens: [], dadosCheckout: null }),
  total: () => get().itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0),
  qtdTotal: () => get().itens.reduce((acc, i) => acc + i.quantidade, 0),
  setDadosCheckout: (d) => set({ dadosCheckout: d }),
}));
