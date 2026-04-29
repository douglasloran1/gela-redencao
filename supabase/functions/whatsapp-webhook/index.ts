// Supabase Edge Function — whatsapp-webhook
// Recebe eventos da Evolution API e processa opt-in/opt-out de clientes

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const EVOLUTION_URL      = Deno.env.get("EVOLUTION_URL") ?? "";
const EVOLUTION_KEY      = Deno.env.get("EVOLUTION_KEY") ?? "";
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") ?? "gela";

async function enviarTexto(telefone: string, mensagem: string) {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) return;
  await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
    body: JSON.stringify({
      number: telefone,
      text: mensagem,
      options: { delay: 500, presence: "composing" },
    }),
  });
}

const PALAVRAS_SIM = ["sim", "s", "quero", "aceito", "ok", "yes", "pode", "claro", "bora", "1"];
const PALAVRAS_NAO = ["nao", "não", "n", "no", "nunca", "cancelar", "parar", "stop", "sair", "remover", "2"];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const evento = body.event as string;
  if (evento !== "messages.upsert") {
    return new Response("Evento ignorado", { status: 200 });
  }

  const data = body.data as Record<string, unknown>;
  const fromMe = (data?.key as Record<string, unknown>)?.fromMe as boolean;
  if (fromMe) return new Response("Mensagem própria ignorada", { status: 200 });

  const remoteJid = (data?.key as Record<string, unknown>)?.remoteJid as string ?? "";
  const telefone  = remoteJid.replace("@s.whatsapp.net", "").replace(/\D/g, "");

  const msg = data?.message as Record<string, unknown>;
  const mensagem = (
    msg?.conversation as string ??
    (msg?.extendedTextMessage as Record<string, unknown>)?.text as string ??
    ""
  );

  if (!telefone || !mensagem) {
    return new Response("Dados insuficientes", { status: 200 });
  }

  const nome  = (data?.pushName as string) ?? "";
  const texto = normalizar(mensagem);

  const ehSim = PALAVRAS_SIM.some((p) => texto === p || texto.startsWith(p + " "));
  const ehNao = PALAVRAS_NAO.some((p) => texto === p || texto.startsWith(p + " "));

  if (ehSim) {
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

    await enviarTexto(
      telefone,
      `✅ *Oba, ${nome || "cliente"}!* Você foi cadastrado com sucesso!\n\nAgora você vai receber nossas promoções e novidades exclusivas direto aqui. 🧊🎉\n\nPara sair a qualquer momento, responda *2* ou *NÃO*.`
    );

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

    await enviarTexto(
      telefone,
      `Tudo bem! Você não vai mais receber promoções do Gela. 👍\n\nSe mudar de ideia, é só responder *1* para se cadastrar novamente.`
    );

    console.log(`[webhook] Opt-out registrado: ${telefone}`);
    return new Response("Opt-out registrado", { status: 200 });
  }

  return new Response("Mensagem não relacionada", { status: 200 });
});