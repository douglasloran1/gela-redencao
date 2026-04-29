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

const EVOLUTION_URL      = Deno.env.get("EVOLUTION_URL") ?? "";
const EVOLUTION_KEY      = Deno.env.get("EVOLUTION_KEY") ?? "";
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") ?? "gela";

async function enviarConfirmacaoOptin(telefone: string, nome: string) {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) return;
  await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
    body: JSON.stringify({
      number: telefone,
      text: `✅ *Oba, ${nome || "cliente"}!* Você foi cadastrado com sucesso para receber promoções e novidades exclusivas do Gela Redenção! 🧊🎉\n\nEm breve você receberá nossas ofertas aqui. Para sair a qualquer momento, responda *NÃO*.`,
      options: { delay: 500, presence: "composing" },
    }),
  });
}

async function enviarConfirmacaoOptout(telefone: string) {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) return;
  await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
    body: JSON.stringify({
      number: telefone,
      text: `Tudo bem! Você foi removido da lista de promoções do Gela. 👍\n\nSe mudar de ideia, é só responder *SIM* para se cadastrar novamente.`,
      options: { delay: 500 },
    }),
  });
}

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

  // Extrai texto da mensagem (texto normal ou resposta de botão)
  const msg = data?.message as Record<string, unknown>;
  const mensagem = (
    msg?.conversation as string ??
    (msg?.extendedTextMessage as Record<string, unknown>)?.text as string ??
    ""
  );

  // Captura resposta de botão ou lista de opções
  const buttonId = (
    (msg?.buttonsResponseMessage as Record<string, unknown>)?.selectedButtonId as string ??
    (msg?.listResponseMessage as Record<string, unknown>)?.singleSelectReply as string ??
    ((msg?.listResponseMessage as Record<string, unknown>)?.singleSelectReply as Record<string, unknown>)?.selectedRowId as string ??
    ""
  ).toUpperCase();

  if (!telefone) {
    return new Response("Dados insuficientes", { status: 200 });
  }

  // Extrai nome do contato (pushName)
  const nome = (data?.pushName as string) ?? "";

  const texto = normalizar(mensagem);

  // Verifica botão clicado primeiro, depois texto livre
  const ehSim = buttonId === "SIM" || PALAVRAS_SIM.some((p) => texto === p || texto.startsWith(p + " "));
  const ehNao = buttonId === "NAO" || PALAVRAS_NAO.some((p) => texto === p || texto.startsWith(p + " "));

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
    await enviarConfirmacaoOptin(telefone, nome);
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
    await enviarConfirmacaoOptout(telefone);
    return new Response("Opt-out registrado", { status: 200 });
  }

  // Mensagem que não é SIM nem NÃO — ignora silenciosamente
  return new Response("Mensagem não relacionada", { status: 200 });
});