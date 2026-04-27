import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Plus, Minus, MapPin, Phone, User, CreditCard, Banknote, Smartphone, Search, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { useCarrinho } from "@/store/carrinho";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const formasPagamento = [
  { id: "pix",      nome: "PIX",     icon: Smartphone, desc: "Aprovação imediata" },
  { id: "dinheiro", nome: "Dinheiro", icon: Banknote,   desc: "Pagar na entrega" },
  { id: "cartao",   nome: "Cartão",  icon: CreditCard, desc: "Débito ou crédito" },
];

const Checkout = () => {
  const navigate = useNavigate();
  const { itens, alterarQtd, remover, total, setDadosCheckout } = useCarrinho();

  const [nome, setNome]           = useState("");
  const [telefone, setTelefone]   = useState("");
  const [cep, setCep]             = useState("");
  const [endereco, setEndereco]   = useState("");
  const [numero, setNumero]       = useState("");
  const [bairro, setBairro]       = useState("");
  const [cidade, setCidade]       = useState("");
  const [referencia, setReferencia] = useState("");
  const [pagamento, setPagamento] = useState("pix");
  const [troco, setTroco]         = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);

  const subtotal    = total();
  const taxaEntrega = subtotal > 0 ? 5 : 0;
  const totalFinal  = subtotal + taxaEntrega;

  // ── API dos Correios via ViaCEP (sem CORS) ───────────────────────────────
  const buscarCep = async (valor: string) => {
    const cepLimpo = valor.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    setBuscandoCep(true);
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();

      if (data.erro) {
        toast.error("CEP não encontrado. Verifique e tente novamente.");
        return;
      }

      setEndereco(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(`${data.localidade} – ${data.uf}`);
      toast.success("Endereço preenchido automaticamente!");

      // Foca no campo número depois
      setTimeout(() => document.getElementById("numero")?.focus(), 100);
    } catch {
      toast.error("Erro ao buscar CEP. Verifique sua conexão.");
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 8);
    if (v.length > 5) v = `${v.slice(0, 5)}-${v.slice(5)}`;
    setCep(v);
    if (v.replace(/\D/g, "").length === 8) buscarCep(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itens.length === 0) { toast.error("Seu carrinho está vazio"); return; }
    if (!nome || !telefone || !cep || !endereco || !numero || !bairro) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setDadosCheckout({ nome, telefone, cep, endereco, numero, bairro, cidade, referencia, formaPagamento: pagamento, troco });
    navigate("/finalizado");
  };

  if (itens.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="font-display text-3xl font-black text-primary mb-2">Carrinho vazio</h2>
          <p className="text-muted-foreground mb-6">Adicione produtos antes de finalizar.</p>
          <Link to="/"><Button className="bg-gradient-gold text-secondary-foreground border-0 font-bold shadow-gold">Ver produtos</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline mb-4">
          <ArrowLeft className="h-4 w-4" /> Continuar comprando
        </Link>
        <h2 className="font-display text-3xl md:text-4xl font-black text-primary mb-6">Finalizar Pedido</h2>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_400px] gap-6">
          <div className="space-y-6">

            {/* Dados pessoais */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 shadow-card border border-border">
              <h3 className="font-display font-bold text-lg text-primary flex items-center gap-2 mb-4">
                <User className="h-5 w-5" /> Seus dados
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="nome">Nome completo *</Label>
                  <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="telefone" className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> Telefone / WhatsApp *
                  </Label>
                  <Input id="telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(84) 99999-9999" />
                </div>
              </div>
            </motion.div>

            {/* Endereço com CEP automático */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-2xl p-6 shadow-card border border-border">
              <h3 className="font-display font-bold text-lg text-primary flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5" /> Endereço de entrega
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">

                {/* CEP */}
                <div className="sm:col-span-1">
                  <Label htmlFor="cep">CEP *</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      value={cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      maxLength={9}
                      className="pr-9"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {buscandoCep
                        ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        : <Search className="h-4 w-4" />
                      }
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Preenchimento automático</p>
                </div>

                {/* Rua (preenchida automaticamente) */}
                <div className="sm:col-span-2">
                  <Label htmlFor="endereco">Rua *</Label>
                  <Input id="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Preenchido pelo CEP" />
                </div>

                {/* Número */}
                <div>
                  <Label htmlFor="numero">Número *</Label>
                  <Input id="numero" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="123" />
                </div>

                {/* Bairro (preenchido automaticamente) */}
                <div>
                  <Label htmlFor="bairro">Bairro *</Label>
                  <Input id="bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Preenchido pelo CEP" />
                </div>

                {/* Cidade (preenchida automaticamente) */}
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Preenchida pelo CEP" />
                </div>

                <div className="sm:col-span-3">
                  <Label htmlFor="referencia">Ponto de referência</Label>
                  <Textarea id="referencia" value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Próximo a..." rows={2} />
                </div>
              </div>
            </motion.div>

            {/* Pagamento */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl p-6 shadow-card border border-border">
              <h3 className="font-display font-bold text-lg text-primary flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5" /> Forma de pagamento
              </h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {formasPagamento.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPagamento(f.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-bounce text-left",
                      pagamento === f.id ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-primary/50"
                    )}
                  >
                    <f.icon className={cn("h-6 w-6 mb-2", pagamento === f.id ? "text-primary" : "text-muted-foreground")} />
                    <p className="font-bold text-foreground">{f.nome}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </button>
                ))}
              </div>
              {pagamento === "dinheiro" && (
                <div className="mt-4">
                  <Label htmlFor="troco">Troco para quanto?</Label>
                  <Input id="troco" value={troco} onChange={(e) => setTroco(e.target.value)} placeholder="Ex: R$ 100" />
                </div>
              )}
            </motion.div>
          </div>

          {/* Resumo */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
              <div className="bg-gradient-hero text-primary-foreground p-5">
                <h3 className="font-display font-black text-xl">Resumo do Pedido</h3>
                <p className="text-sm text-primary-foreground/80">{itens.length} {itens.length === 1 ? "item" : "itens"}</p>
              </div>
              <div className="p-5 space-y-3 max-h-72 overflow-y-auto">
                {itens.map((i) => (
                  <div key={i.id} className="flex gap-3 items-center">
                    <img src={i.imagem} alt={i.nome} className="h-14 w-14 rounded-lg object-cover bg-muted" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect width='56' height='56' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='24'%3E🧊%3C/text%3E%3C/svg%3E"; }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{i.nome}</p>
                      <p className="text-xs text-primary font-bold">R$ {(i.preco * i.quantidade).toFixed(2).replace(".", ",")}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => alterarQtd(i.id, i.quantidade - 1)} className="h-6 w-6 rounded-full bg-muted hover:bg-border flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                      <span className="text-sm font-bold w-5 text-center">{i.quantidade}</span>
                      <button type="button" onClick={() => alterarQtd(i.id, i.quantidade + 1)} className="h-6 w-6 rounded-full bg-secondary hover:bg-secondary-glow flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                      <button type="button" onClick={() => remover(i.id)} className="h-6 w-6 rounded-full hover:bg-destructive/10 text-destructive flex items-center justify-center ml-1"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border p-5 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>R$ {subtotal.toFixed(2).replace(".", ",")}</span></div>
                <div className="flex justify-between text-sm text-muted-foreground"><span>Taxa de entrega</span><span>R$ {taxaEntrega.toFixed(2).replace(".", ",")}</span></div>
                <div className="flex justify-between text-xl font-display font-black text-primary pt-2 border-t border-border"><span>Total</span><span>R$ {totalFinal.toFixed(2).replace(".", ",")}</span></div>
                <Button type="submit" size="lg" className="w-full mt-3 bg-gradient-gold text-secondary-foreground border-0 font-bold shadow-gold hover:opacity-95 text-base h-12">
                  Confirmar Pedido →
                </Button>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
