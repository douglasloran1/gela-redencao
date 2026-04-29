// Supabase Edge Function — whatsapp-webhook
// Recebe eventos da Evolution API e processa opt-in/opt-out de clientes
//
// URL do webhook (após deploy):
// https://<seu-projeto>.supabase.co/functions/v1/whatsapp-webhook

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Palavras que significam SIM / NÃO (aceita variações comuns)
const PALAVRAS_SIM = ["sim", "s", "quero", "aceito", "ok", "yes", "pode", "claro", "bora"];
const PALAVRAS_NAO = ["nao", "não", "n", "no", "nunca", "cancelar", "parar", "stop", "sair", "remover"];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // remove acentos
    .trim();
}

Deno.serve(async (req: Request) => {
  // Aceita somente POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Evolution API envia eventos do tipo "messages.upsert"
  const evento = body.event as string;
  if (evento !== "messages.upsert") {
    return new Response("Evento ignorado", { status: 200 });
  }

  const data = body.data as Record<string, unknown>;

  // Ignora mensagens enviadas pela própria instância (fromMe = true)
  const fromMe = (data?.key as Record<string, unknown>)?.fromMe as boolean;
  if (fromMe) return new Response("Mensagem própria ignorada", { status: 200 });

  // Extrai número e conteúdo da mensagem
  const remoteJid = (data?.key as Record<string, unknown>)?.remoteJid as string ?? "";
  const telefone  = remoteJid.replace("@s.whatsapp.net", "").replace(/\D/g, "");

  const mensagem = (
    (data?.message as Record<string, unknown>)?.conversation as string ??
    ((data?.message as Record<string, unknown>)?.extendedTextMessage as Record<string, unknown>)?.text as string ??
    ""
  );

  if (!telefone || !mensagem) {
    return new Response("Dados insuficientes", { status: 200 });
  }

  // Extrai nome do contato (pushName)
  const nome = (data?.pushName as string) ?? "";

  const texto = normalizar(mensagem);

  const ehSim = PALAVRAS_SIM.some((p) => texto === p || texto.startsWith(p + " "));
  const ehNao = PALAVRAS_NAO.some((p) => texto === p || texto.startsWith(p + " "));

  if (ehSim) {
    // Upsert: insere ou reativa se já existia
    const { error } = await supabase
      .from("clientes_notificacao")
      .upsert(
        { telefone, nome, ativo: true, aceito_em: new Date().toISOString() },
        { onConflict: "telefone" }
      );

    if (error) {
      console.error("[webhook] Erro ao salvar opt-in:", error.message);
      return new Response("Erro interno", { status: 500 });
    }

    console.log(`[webhook] Opt-in registrado: ${telefone} (${nome})`);
    return new Response("Opt-in registrado", { status: 200 });
  }

  if (ehNao) {
    const { error } = await supabase
      .from("clientes_notificacao")
      .update({ ativo: false })
      .eq("telefone", telefone);

    if (error) {
      console.error("[webhook] Erro ao remover opt-out:", error.message);
      return new Response("Erro interno", { status: 500 });
    }

    console.log(`[webhook] Opt-out registrado: ${telefone}`);
    return new Response("Opt-out registrado", { status: 200 });
  }

  // Mensagem que não é SIM nem NÃO — ignora silenciosamente
  return new Response("Mensagem não relacionada", { status: 200 });
});