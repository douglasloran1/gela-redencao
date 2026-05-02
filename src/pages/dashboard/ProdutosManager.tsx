import { useEffect, useState, useRef, useCallback } from "react";
import {
  Plus, Pencil, Trash2, X, Check, ImagePlus,
  Package, Loader2, RefreshCw, Upload, Link as LinkIcon, Copy,
} from "lucide-react";
import { useProdutos, Produto } from "@/store/produtos";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ── Bucket do Supabase Storage ─────────────────────────────────────────────
const BUCKET = "produtos";

// ── Upload de imagem para o Supabase Storage ───────────────────────────────
async function uploadImagem(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const nome = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(nome, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error("Erro no upload: " + error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(nome);
  return data.publicUrl;
}

const BADGES = ["", "MAIS VENDIDO", "PROMO", "NOVO", "GELADO", "PREMIUM", "ESGOTADO"];
const FORM_VAZIO = { nome: "", descricao: "", preco: "", categoria: "", imagem: "", badge: "" };
type FormData = typeof FORM_VAZIO;

// ── Componente de upload de imagem ─────────────────────────────────────────
function ImageUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [modo, setModo] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);
  const [urlInput, setUrlInput] = useState(value.startsWith("http") ? value : "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Drag-and-drop
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }
    setUploading(true);
    try {
      // Preview imediato local
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);

      const publicUrl = await uploadImagem(file);
      setPreview(publicUrl);
      onChange(publicUrl);
      toast.success("✅ Imagem enviada ao Supabase Storage!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro no upload");
      setPreview("");
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleUrl = () => {
    if (!urlInput.startsWith("http")) {
      toast.error("Cole uma URL válida começando com http");
      return;
    }
    setPreview(urlInput);
    onChange(urlInput);
    toast.success("URL definida!");
  };

  return (
    <div className="space-y-3">
      {/* Toggle upload / url */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => setModo("upload")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            modo === "upload" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Upload className="h-3 w-3" /> Upload
        </button>
        <button
          type="button"
          onClick={() => setModo("url")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            modo === "url" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <LinkIcon className="h-3 w-3" /> URL
        </button>
      </div>

      <div className="flex items-start gap-4">
        {/* Preview */}
        <div
          className={`relative h-28 w-28 rounded-xl border-2 flex-shrink-0 overflow-hidden flex items-center justify-center transition-all cursor-pointer ${
            dragging
              ? "border-[#f5a500] bg-amber-50 scale-105"
              : "border-dashed border-gray-200 bg-gray-50 hover:border-[#f5a500]"
          }`}
          onClick={() => modo === "upload" && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-[#f5a500]">
              <Loader2 className="h-7 w-7 animate-spin" />
              <span className="text-[10px] font-semibold">Enviando...</span>
            </div>
          ) : preview ? (
            <>
              <img
                src={preview}
                alt="preview"
                className="h-full w-full object-contain p-1"
                onError={() => setPreview("")}
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPreview(""); onChange(""); }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <div className="text-center text-gray-400 p-2">
              <ImagePlus className="h-8 w-8 mx-auto mb-1" />
              <span className="text-[10px] leading-tight">
                {modo === "upload" ? "Clique ou arraste" : "Pré-visualização"}
              </span>
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="flex-1 space-y-2">
          {modo === "upload" ? (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFile}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full border-[#f5a500]/50 text-[#f5a500] hover:bg-[#f5a500]/10 font-semibold"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Upload className="h-4 w-4" /> Escolher foto</>
                )}
              </Button>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Enviado direto ao <strong>Supabase Storage</strong>.<br />
                Formatos: JPG, PNG, WebP. Máx. 5MB.<br />
                Arraste a foto para a área ao lado.
              </p>
            </>
          ) : (
            <>
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://exemplo.com/foto.jpg"
                className="text-sm"
              />
              <Button
                type="button"
                size="sm"
                className="w-full bg-[#f5a500] hover:bg-[#e09500] text-[#0f1b3d] font-bold"
                onClick={handleUrl}
              >
                <Check className="h-4 w-4" /> Usar esta URL
              </Button>
              <p className="text-[11px] text-gray-400">
                Cole a URL pública de uma imagem externa.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Formulário de produto ──────────────────────────────────────────────────
function FormProduto({
  inicial, onSalvar, onCancelar, salvando, titulo,
}: {
  inicial: FormData;
  onSalvar: (d: FormData) => Promise<void>;
  onCancelar: () => void;
  salvando: boolean;
  titulo?: string;
}) {
  const [form, setForm] = useState(inicial);
  const set = (k: keyof FormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.nome || !form.preco || !form.categoria) {
      toast.error("Nome, preço e categoria são obrigatórios.");
      return;
    }
    if (isNaN(Number(form.preco)) || Number(form.preco) <= 0) {
      toast.error("Preço inválido.");
      return;
    }
    await onSalvar(form);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white border border-[#f5a500]/30 rounded-2xl p-5 mb-4 shadow-lg"
    >
      {titulo && (
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
          <Package className="h-4 w-4 text-[#f5a500]" /> {titulo}
        </h3>
      )}

      <div className="space-y-4">
        {/* Upload de imagem */}
        <div>
          <Label className="text-xs font-semibold text-gray-600 mb-2 block">Foto do produto</Label>
          <ImageUploader value={form.imagem} onChange={(url) => set("imagem", url)} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-gray-600">Nome *</Label>
            <Input
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              placeholder="Ex: Cerveja Skol Lata 350ml"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-600">Preço (R$) *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.preco}
              onChange={(e) => set("preco", e.target.value)}
              placeholder="0,00"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-600">Categoria *</Label>
            <Input
              value={form.categoria}
              onChange={(e) => set("categoria", e.target.value)}
              placeholder="Ex: Cervejas"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-600">Badge (etiqueta)</Label>
            <select
              value={form.badge}
              onChange={(e) => set("badge", e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {BADGES.map((b) => <option key={b} value={b}>{b || "— Sem badge —"}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold text-gray-600">Descrição</Label>
            <Input
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
              placeholder="Ex: Skol gelada - Pack c/ 12"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-5 justify-end">
        <Button type="button" size="sm" variant="ghost" onClick={onCancelar} className="text-gray-500" disabled={salvando}>
          <X className="h-4 w-4" /> Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={salvando}
          className="bg-[#f5a500] hover:bg-[#e09500] text-[#0f1b3d] font-bold"
        >
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {salvando ? "Salvando..." : "Salvar produto"}
        </Button>
      </div>
    </motion.div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export function ProdutosManager() {
  const { produtos, carregando, erro, carregar, adicionar, editar, excluir } = useProdutos();
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [confirmarExcluir, setConfirmarExcluir] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [removendoDups, setRemovendoDups] = useState(false);

  const handleRemoverDuplicados = async () => {
    setRemovendoDups(true);
    try {
      // Agrupa por nome normalizado
      const grupos: Record<string, typeof produtos> = {};
      for (const p of produtos) {
        const key = p.nome.trim().toUpperCase();
        if (!grupos[key]) grupos[key] = [];
        grupos[key].push(p);
      }

      const idsParaDeletar: string[] = [];
      for (const grupo of Object.values(grupos)) {
        if (grupo.length < 2) continue;
        // Ordena: primeiro os que têm imagem, depois por ID crescente
        const ordenados = [...grupo].sort((a, b) => {
          const aTemImg = a.imagem ? 0 : 1;
          const bTemImg = b.imagem ? 0 : 1;
          if (aTemImg !== bTemImg) return aTemImg - bTemImg;
          return Number(a.id) - Number(b.id);
        });
        // Mantém o primeiro, deleta o resto
        for (const dup of ordenados.slice(1)) {
          idsParaDeletar.push(dup.id);
        }
      }

      if (idsParaDeletar.length === 0) {
        toast.info("Nenhum duplicado encontrado!");
        return;
      }

      // Deleta em lotes de 50
      let deletados = 0;
      for (let i = 0; i < idsParaDeletar.length; i += 50) {
        const lote = idsParaDeletar.slice(i, i + 50);
        const { error } = await supabase.from("produtos").delete().in("id", lote);
        if (!error) deletados += lote.length;
      }

      await carregar();
      toast.success(`✅ ${deletados} produtos duplicados removidos!`);
    } catch (e) {
      toast.error("Erro ao remover duplicados: " + String(e));
    } finally {
      setRemovendoDups(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.categoria.toLowerCase().includes(busca.toLowerCase())
  );

  const handleSalvarNovo = async (form: FormData) => {
    setSalvando(true);
    try {
      await adicionar({
        nome: form.nome,
        descricao: form.descricao,
        preco: Number(form.preco),
        categoria: form.categoria,
        imagem: form.imagem || "",
        badge: form.badge || undefined,
      });
      setAdicionando(false);
      toast.success("✅ Produto salvo com sucesso!");
    } catch (e: unknown) {
      toast.error("Erro: " + (e instanceof Error ? e.message : String(e)));
    } finally { setSalvando(false); }
  };

  const handleSalvarEdicao = async (form: FormData) => {
    if (!editandoId) return;
    const prod = produtos.find((p) => p.id === editandoId);
    if (!prod) return;
    setSalvando(true);
    try {
      await editar({
        ...prod,
        nome: form.nome,
        descricao: form.descricao,
        preco: Number(form.preco),
        categoria: form.categoria,
        imagem: form.imagem || prod.imagem,
        badge: form.badge || undefined,
      });
      setEditandoId(null);
      toast.success("✅ Produto atualizado!");
    } catch (e: unknown) {
      toast.error("Erro: " + (e instanceof Error ? e.message : String(e)));
    } finally { setSalvando(false); }
  };

  const handleExcluir = async (id: string) => {
    setExcluindo(id);
    try {
      await excluir(id);
      setConfirmarExcluir(null);
      toast.success("🗑️ Produto excluído!");
    } catch (e: unknown) {
      toast.error("Erro: " + (e instanceof Error ? e.message : String(e)));
    } finally { setExcluindo(null); }
  };

  const prodToForm = (p: Produto): FormData => ({
    nome: p.nome,
    descricao: p.descricao,
    preco: String(p.preco),
    categoria: p.categoria,
    imagem: p.imagem,
    badge: p.badge || "",
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Package className="h-5 w-5 text-[#f5a500]" />
          <h2 className="font-bold text-lg text-white">Gerenciar Produtos</h2>
          <span className="bg-white/10 text-white text-xs px-2 py-0.5 rounded-full">
            {produtos.length} produtos
          </span>
          <span className="bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full font-semibold">
            Supabase ☁️
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-9 w-44 text-sm"
          />
          <Button size="sm" variant="ghost" onClick={() => carregar()} className="text-white/70 hover:text-white h-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRemoverDuplicados}
            disabled={removendoDups || carregando}
            className="text-amber-400 hover:text-amber-300 hover:bg-white/10 h-9 gap-1.5"
            title="Remover produtos duplicados"
          >
            {removendoDups
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Copy className="h-4 w-4" />
            }
            <span className="hidden sm:inline text-xs font-semibold">
              {removendoDups ? "Removendo..." : "Remover Duplicados"}
            </span>
          </Button>
          {!adicionando && (
            <Button
              size="sm"
              onClick={() => { setAdicionando(true); setEditandoId(null); }}
              className="bg-[#f5a500] hover:bg-[#e09500] text-[#0f1b3d] font-bold h-9"
            >
              <Plus className="h-4 w-4" /> Novo produto
            </Button>
          )}
        </div>
      </div>

      {/* Aviso sobre bucket */}
      <div className="bg-blue-900/40 border border-blue-400/20 rounded-xl p-3 text-blue-200 text-xs leading-relaxed">
        📦 As fotos são enviadas para o bucket <code className="bg-white/10 px-1 rounded">produtos</code> do Supabase Storage.
        Crie o bucket como <strong>público</strong> e libere as policies de <code className="bg-white/10 px-1 rounded">insert</code> e <code className="bg-white/10 px-1 rounded">select</code>.
      </div>

      {/* Form novo produto */}
      <AnimatePresence>
        {adicionando && (
          <FormProduto
            titulo="Novo Produto"
            inicial={FORM_VAZIO}
            onSalvar={handleSalvarNovo}
            onCancelar={() => setAdicionando(false)}
            salvando={salvando}
          />
        )}
      </AnimatePresence>

      {/* Carregando */}
      {carregando && (
        <div className="flex items-center justify-center py-16 gap-3 text-white/60">
          <Loader2 className="h-7 w-7 animate-spin text-[#f5a500]" />
          <span>Carregando do Supabase...</span>
        </div>
      )}

      {/* Erro */}
      {erro && !carregando && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center text-red-300">
          <p className="font-semibold mb-2">Erro ao carregar produtos</p>
          <p className="text-sm opacity-80 mb-3">{erro}</p>
          <Button size="sm" onClick={() => carregar()} className="bg-red-500 text-white">
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Lista */}
      {!carregando && !erro && (
        <div className="grid gap-3">
          <AnimatePresence>
            {produtosFiltrados.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
              >
                {/* Form de edição inline */}
                <AnimatePresence>
                  {editandoId === p.id && (
                    <div className="p-3">
                      <FormProduto
                        titulo={`Editando: ${p.nome}`}
                        inicial={prodToForm(p)}
                        onSalvar={handleSalvarEdicao}
                        onCancelar={() => setEditandoId(null)}
                        salvando={salvando}
                      />
                    </div>
                  )}
                </AnimatePresence>

                {/* Card normal */}
                {editandoId !== p.id && (
                  <div className="flex items-center gap-3 p-3">
                    {/* Imagem */}
                    <div className="h-14 w-14 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                      {p.imagem ? (
                        <img
                          src={p.imagem}
                          alt={p.nome}
                          className="h-full w-full object-contain p-0.5"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect width='56' height='56' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='24'%3E🧊%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-2xl">🧊</div>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm truncate">{p.nome}</span>
                        {p.badge && (
                          <span className="bg-[#f5a500] text-[#0f1b3d] text-[10px] font-black px-1.5 py-0.5 rounded-full">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs truncate mt-0.5">{p.descricao || "—"}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[#f5a500] font-bold text-sm">
                          R$ {p.preco.toFixed(2).replace(".", ",")}
                        </span>
                        <span className="text-gray-700 font-semibold text-xs bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                          {p.categoria}
                        </span>
                        {/* Indicador se tem imagem no Storage */}
                        {p.imagem?.includes("supabase") && (
                          <span className="text-green-600 text-[10px] font-semibold bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
                            ☁️ Storage
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => { setEditandoId(p.id); setAdicionando(false); }}
                        className="h-8 w-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      {confirmarExcluir === p.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleExcluir(p.id)}
                            disabled={excluindo === p.id}
                            className="h-8 px-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1"
                          >
                            {excluindo === p.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <Check className="h-3 w-3" />}
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmarExcluir(null)}
                            className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmarExcluir(p.id)}
                          className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 flex items-center justify-center transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {produtosFiltrados.length === 0 && !carregando && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-3 text-white/20" />
              <p className="font-semibold text-white/50">Nenhum produto encontrado.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}