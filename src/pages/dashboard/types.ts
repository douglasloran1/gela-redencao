import { supabase } from "@/lib/supabase";

export type ItemPedido = {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  categoria: string;
};

export type Pedido = {
  id: string;
  data: string;
  cliente: string;
  telefone: string;
  endereco: string;
  referencia: string;
  formaPagamento: string;
  troco: string;
  itens: ItemPedido[];
  subtotal: number;
  taxaEntrega: number;
  total: number;
  status: "pendente" | "concluido" | "cancelado";
};

// ── Converte linha do Supabase → Pedido ──────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPedido(row: any): Pedido {
  return {
    id:             row.id,
    data:           row.data,
    cliente:        row.cliente,
    telefone:       row.telefone,
    endereco:       row.endereco,
    referencia:     row.referencia ?? "",
    formaPagamento: row.forma_pagamento,
    troco:          row.troco ?? "",
    itens:          Array.isArray(row.itens) ? row.itens : JSON.parse(row.itens ?? "[]"),
    subtotal:       Number(row.subtotal),
    taxaEntrega:    Number(row.taxa_entrega),
    total:          Number(row.total),
    status:         row.status,
  };
}

// ── Carregar pedidos do Supabase ─────────────────────────────────────────────
export async function carregarPedidos(): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .order("data", { ascending: false });

  if (error) {
    console.error("[Supabase] Erro ao carregar pedidos:", error.message);
    return [];
  }

  return (data ?? []).map(rowToPedido);
}

// ── Salvar novo pedido no Supabase ───────────────────────────────────────────
export async function salvarPedido(pedido: Pedido): Promise<{ ok: boolean; erro?: string }> {
  const { error } = await supabase.from("pedidos").insert({
    id:              pedido.id,
    data:            pedido.data,
    cliente:         pedido.cliente,
    telefone:        pedido.telefone,
    endereco:        pedido.endereco,
    referencia:      pedido.referencia ?? "",
    forma_pagamento: pedido.formaPagamento,
    troco:           pedido.troco ?? "",
    itens:           pedido.itens,
    subtotal:        pedido.subtotal,
    taxa_entrega:    pedido.taxaEntrega,
    total:           pedido.total,
    status:          pedido.status,
  });

  if (error) {
    console.error("[Supabase] Erro ao salvar pedido:", error.message);
    return { ok: false, erro: error.message };
  }

  return { ok: true };
}

// ── Atualizar status no Supabase ─────────────────────────────────────────────
export async function atualizarStatus(id: string, status: Pedido["status"]): Promise<void> {
  const { error } = await supabase
    .from("pedidos")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("[Supabase] Erro ao atualizar status:", error.message);
  }
}

// ── Escutar novos pedidos em tempo real (Realtime) ───────────────────────────
export function escutarPedidos(onNovo: (pedido: Pedido) => void) {
  return supabase
    .channel("pedidos-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "pedidos" },
      (payload) => onNovo(rowToPedido(payload.new))
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "pedidos" },
      (payload) => onNovo(rowToPedido(payload.new))
    )
    .subscribe();
}

// ── Labels ───────────────────────────────────────────────────────────────────
export const PAGAMENTO_LABEL: Record<string, string> = {
  pix:      "PIX ⚡",
  dinheiro: "Dinheiro 💵",
  cartao:   "Cartão 💳",
};

export const STATUS_LABEL: Record<string, string> = {
  pendente:  "Pendente",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

// ── Filtros ──────────────────────────────────────────────────────────────────
export function filtrarPorPeriodo(
  pedidos: Pedido[],
  periodo: "dia" | "semana" | "mes" | "todos"
): Pedido[] {
  if (periodo === "todos") return pedidos;
  const agora = new Date();
  return pedidos.filter((p) => {
    const data = new Date(p.data);
    if (periodo === "dia")    return data.toDateString() === agora.toDateString();
    if (periodo === "semana") return (agora.getTime() - data.getTime()) / 86400000 <= 7;
    if (periodo === "mes")    return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
    return true;
  });
}

export function topItens(
  pedidos: Pedido[]
): { nome: string; quantidade: number; receita: number }[] {
  const map: Record<string, { nome: string; quantidade: number; receita: number }> = {};
  pedidos.forEach((p) => {
    p.itens.forEach((i) => {
      if (!map[i.nome]) map[i.nome] = { nome: i.nome, quantidade: 0, receita: 0 };
      map[i.nome].quantidade += i.quantidade;
      map[i.nome].receita    += i.preco * i.quantidade;
    });
  });
  return Object.values(map).sort((a, b) => b.quantidade - a.quantidade);
}

export function pedidosPorDia(
  pedidos: Pedido[],
  dias: number
): { label: string; pedidos: number; receita: number }[] {
  const result = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label  = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const dosDia = pedidos.filter((p) => new Date(p.data).toDateString() === d.toDateString());
    result.push({
      label,
      pedidos: dosDia.length,
      receita: dosDia.reduce((s, p) => s + p.total, 0),
    });
  }
  return result;
}