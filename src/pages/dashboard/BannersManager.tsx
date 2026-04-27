import { useEffect, useState, useRef } from "react";
import {
  Plus, Trash2, X, Check, ImagePlus, Image as ImageIcon,
  Loader2, RefreshCw, Eye, EyeOff, GripVertical,
} from "lucide-react";
import { useBanners, Banner } from "@/store/banners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const FORM_VAZIO = { imagem: "", titulo: "", subtitulo: "", ordem: 0, ativo: true };
type FormData = typeof FORM_VAZIO;

function FormBanner({
  inicial, onSalvar, onCancelar, salvando, proximaOrdem,
}: {
  inicial: FormData;
  onSalvar: (d: FormData) => Promise<void>;
  onCancelar: () => void;
  salvando: boolean;
  proximaOrdem: number;
}) {
  const [form, setForm] = useState({ ...inicial, ordem: inicial.ordem || proximaOrdem });
  const [preview, setPreview] = useState(inicial.imagem || "");

  const set = (k: keyof FormData, v: string | number | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.imagem) { toast.error("Adicione a URL da imagem."); return; }
    await onSalvar(form);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="bg-[#1a2a5e] border border-[#f5a500]/30 rounded-2xl p-5 mb-4 shadow-xl"
    >
      <h3 className="font-bold text-[#f5a500] mb-4 flex items-center gap-2 text-base">
        <ImageIcon className="h-4 w-4" /> Novo Banner
      </h3>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Preview */}
        <div className="sm:col-span-2 flex items-start gap-4">
          <div className="h-28 w-52 rounded-xl border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
            {preview ? (
              <img src={preview} alt="preview" className="h-full w-full object-cover"
                onError={() => setPreview("")} />
            ) : (
              <div className="text-center text-white/30">
                <ImagePlus className="h-8 w-8 mx-auto mb-1" />
                <span className="text-xs">Preview</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <Label className="text-xs font-semibold text-white/70">URL da imagem *</Label>
            <Input
              value={form.imagem}
              onChange={(e) => { set("imagem", e.target.value); setPreview(e.target.value); }}
              placeholder="https://..."
              className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#f5a500]"
            />
            <p className="text-[11px] text-white/40 mt-1">
              Use URLs públicas (ex: Supabase Storage, Imgur, etc.)
            </p>
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-white/70">Título (opcional)</Label>
          <Input value={form.titulo} onChange={(e) => set("titulo", e.target.value)}
            placeholder="Ex: Promoção de Verão"
            className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#f5a500]" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-white/70">Subtítulo (opcional)</Label>
          <Input value={form.subtitulo} onChange={(e) => set("subtitulo", e.target.value)}
            placeholder="Ex: Até 30% off em cervejas"
            className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#f5a500]" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-white/70">Ordem</Label>
          <Input type="number" min="0" value={form.ordem}
            onChange={(e) => set("ordem", Number(e.target.value))}
            className="mt-1 bg-white/10 border-white/20 text-white focus:border-[#f5a500]" />
        </div>
        <div className="flex items-center gap-3 mt-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.ativo} onChange={(e) => set("ativo", e.target.checked)}
              className="h-4 w-4 accent-[#f5a500]" />
            <span className="text-sm font-semibold text-white">Banner ativo</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 mt-4 justify-end">
        <Button type="button" size="sm" variant="ghost" onClick={onCancelar}
          className="text-white/60 hover:text-white" disabled={salvando}>
          <X className="h-4 w-4" /> Cancelar
        </Button>
        <Button type="button" size="sm" onClick={handleSubmit} disabled={salvando}
          className="bg-[#f5a500] hover:bg-[#e09500] text-[#0f1b3d] font-bold">
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {salvando ? "Salvando..." : "Salvar banner"}
        </Button>
      </div>
    </motion.div>
  );
}

export function BannersManager() {
  const { banners, carregando, erro, carregar, adicionar, editar, excluir } = useBanners();
  const [adicionando, setAdicionando] = useState(false);
  const [confirmarExcluir, setConfirmarExcluir] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);

  useEffect(() => { carregar(); }, []);

  const proximaOrdem = banners.length > 0 ? Math.max(...banners.map((b) => b.ordem)) + 1 : 1;

  const handleSalvarNovo = async (form: FormData) => {
    setSalvando(true);
    try {
      await adicionar({ imagem: form.imagem, titulo: form.titulo, subtitulo: form.subtitulo, ordem: form.ordem, ativo: form.ativo });
      setAdicionando(false);
      toast.success("✅ Banner adicionado!");
    } catch (e: unknown) {
      toast.error("Erro: " + (e instanceof Error ? e.message : String(e)));
    } finally { setSalvando(false); }
  };

  const handleToggleAtivo = async (banner: Banner) => {
    try {
      await editar({ ...banner, ativo: !banner.ativo });
      toast.success(banner.ativo ? "Banner desativado" : "Banner ativado");
    } catch (e: unknown) { toast.error("Erro: " + (e instanceof Error ? e.message : String(e))); }
  };

  const handleExcluir = async (id: string) => {
    setExcluindo(id);
    try {
      await excluir(id);
      setConfirmarExcluir(null);
      toast.success("🗑️ Banner excluído!");
    } catch (e: unknown) {
      toast.error("Erro: " + (e instanceof Error ? e.message : String(e)));
    } finally { setExcluindo(null); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-[#f5a500]" />
          {/* ✅ COR CORRIGIDA: branco nítido */}
          <h2 className="font-bold text-lg text-white">Banners do Carrossel</h2>
          <span className="bg-white/10 text-white text-xs px-2 py-0.5 rounded-full">{banners.length} banners</span>
          <span className="bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full font-semibold">Supabase ☁️</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => carregar()} className="text-white/70 hover:text-white h-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
          {!adicionando && (
            <Button size="sm" onClick={() => setAdicionando(true)}
              className="bg-[#f5a500] hover:bg-[#e09500] text-[#0f1b3d] font-bold h-9">
              <Plus className="h-4 w-4" /> Novo banner
            </Button>
          )}
        </div>
      </div>

      {/* Instrução de uso */}
      <div className="bg-blue-900/40 border border-blue-400/20 rounded-xl p-3 text-blue-200 text-xs leading-relaxed">
        💡 <strong>Como adicionar um banner:</strong> Faça upload da imagem no <strong>Supabase Storage</strong> (bucket público), copie a URL pública e cole no campo abaixo. A tabela precisa ter as colunas: <code className="bg-white/10 px-1 rounded">id, imagem, titulo, subtitulo, ordem, ativo</code>.
      </div>

      <AnimatePresence>
        {adicionando && (
          <FormBanner inicial={FORM_VAZIO} onSalvar={handleSalvarNovo}
            onCancelar={() => setAdicionando(false)} salvando={salvando} proximaOrdem={proximaOrdem} />
        )}
      </AnimatePresence>

      {carregando && (
        <div className="flex items-center justify-center py-16 gap-3 text-white/50">
          <Loader2 className="h-7 w-7 animate-spin text-[#f5a500]" /> <span>Carregando banners...</span>
        </div>
      )}

      {erro && !carregando && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center text-red-300">
          <p className="font-semibold mb-2">Erro ao carregar banners</p>
          <p className="text-sm opacity-80 mb-3">{erro}</p>
          <Button size="sm" onClick={() => carregar()} className="bg-red-500 text-white">Tentar novamente</Button>
        </div>
      )}

      {!carregando && !erro && (
        <div className="grid gap-3">
          <AnimatePresence>
            {banners
              .slice().sort((a, b) => a.ordem - b.ordem)
              .map((banner) => (
                <motion.div key={banner.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                  className={`border rounded-xl overflow-hidden transition-all ${banner.ativo ? "bg-white/8 border-white/15" : "bg-white/3 border-white/8 opacity-60"}`}>
                  <div className="flex items-center gap-3 p-3">
                    <GripVertical className="h-4 w-4 text-white/20 flex-shrink-0" />
                    <div className="h-16 w-28 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                      <img src={banner.imagem} alt={banner.titulo || "Banner"}
                        className="h-full w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* ✅ COR CORRIGIDA: branco nítido */}
                        <span className="font-semibold text-white text-sm truncate">
                          {banner.titulo || "Banner sem título"}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${banner.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/40"}`}>
                          {banner.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      {/* ✅ COR CORRIGIDA: subtítulo visível */}
                      {banner.subtitulo && <p className="text-white/60 text-xs truncate mt-0.5">{banner.subtitulo}</p>}
                      <p className="text-white/40 text-xs mt-1">Ordem: {banner.ordem}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => handleToggleAtivo(banner)}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${banner.ativo ? "bg-green-500/20 hover:bg-green-500/40 text-green-300" : "bg-white/10 hover:bg-white/20 text-white/40"}`}
                        title={banner.ativo ? "Desativar" : "Ativar"}>
                        {banner.ativo ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      {confirmarExcluir === banner.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleExcluir(banner.id)} disabled={excluindo === banner.id}
                            className="h-8 px-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1">
                            {excluindo === banner.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Confirmar
                          </button>
                          <button onClick={() => setConfirmarExcluir(null)}
                            className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 flex items-center justify-center">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmarExcluir(banner.id)}
                          className="h-8 w-8 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 flex items-center justify-center transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
          {banners.length === 0 && (
            <div className="text-center py-12 text-white/30">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              {/* ✅ COR CORRIGIDA */}
              <p className="font-semibold text-black/50">Nenhum banner cadastrado.</p>
              <p className="text-sm mt-1 text-black/30">Adicione banners para o carrossel da loja.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
