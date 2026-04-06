import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { createSubscriptionRequest, uploadImage } from "@/data/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, CreditCard, Receipt, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/data/api";

const DEFAULT_PLANS = [
  {
    id: "mensal",
    name: "Plano Mensal",
    defaultPrice: "2.500 Kz",
    defaultAmount: 2500,
    period: "por mês",
    description: "Ideal para quem está a começar e quer testar a plataforma.",
    features: [
      "Perfil visível publicamente",
      "Aparecer em resultados de busca",
      "Link direto para WhatsApp",
      "Estatísticas de visualização",
    ]
  },
  {
    id: "trimestral",
    name: "Plano Trimestral",
    defaultPrice: "6.500 Kz",
    defaultAmount: 6500,
    period: "por 3 meses",
    description: "A melhor escolha para profissionais estabelecidos. Economize 1.000 Kz.",
    features: [
      "Todas as funcionalidades do mensal",
      "Prioridade moderada em buscas",
      "Selo de profissional ativo",
      "Suporte prioritário",
    ],
    popular: true
  }
];

const SubscriptionPlans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>("trimestral");
  const [paymentMethod, setPaymentMethod] = useState<string>("express");
  const [phone, setPhone] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: settings = {} } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: getSiteSettings,
  });

  const plans = DEFAULT_PLANS.map(p => {
    const dbPrice = p.id === 'mensal' ? settings.price_monthly : settings.price_quarterly;
    return {
      ...p,
      amount: dbPrice ? parseInt(dbPrice) : p.defaultAmount,
      price: dbPrice ? `${parseInt(dbPrice).toLocaleString()} Kz` : p.defaultPrice
    };
  });

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate("/login");

    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    setLoading(true);
    try {
      let proofUrl = "";
      if (paymentMethod === "transfer" && proofFile) {
        toast.info("A carregar comprovativo...");
        const url = await uploadImage(proofFile);
        if (url) proofUrl = url;
      }

      if (paymentMethod === "express" && !phone) {
        toast.error("Por favor, insira o seu número do MCX Express.");
        setLoading(false);
        return;
      }

      await createSubscriptionRequest({
        professional_id: user.id,
        plan: selectedPlan as 'mensal' | 'trimestral',
        amount: plan.amount,
        payment_method: paymentMethod,
        payment_proof_url: proofUrl,
        status: paymentMethod === "express" ? 'active' : 'pending' // Simulação: Express ativa logo
      });

      setSuccess(true);
      toast.success("Pedido de subscrição enviado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao processar subscrição. Tente novamente.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full bg-card border border-border p-8 rounded-3xl shadow-xl text-center"
          >
            <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Pagamento Recebido!</h1>
            <p className="text-muted-foreground mb-8">
              {paymentMethod === "express"
                ? `A sua conta foi ativada com sucesso. Já pode aparecer nos resultados de busca! (Referência Express: ${settings.mcx_express_phone || "923 000 000"})`
                : `Recebemos o seu comprovativo. O seu perfil será ativado assim que validarmos a transferência. Se tiver pressa, envie o comprovativo para o WhatsApp ${settings.payment_proof_whatsapp || "923 000 000"}.`}
            </p>
            <Button size="lg" className="w-full bg-gradient-hero" onClick={() => navigate("/perfil-editar")}>
              Ir para o Meu Perfil
            </Button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 container max-w-6xl">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
          >
            Ative o seu Perfil Profissional
          </motion.h1>
          <motion.p
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Escolha o melhor plano para o seu negócio e comece a receber pedidos de clientes hoje mesmo.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Coluna 1: Planos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 + 0.2 }}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative cursor-pointer transition-all duration-300 ${selectedPlan === plan.id
                    ? "ring-2 ring-primary scale-[1.02] shadow-lg"
                    : "hover:border-primary/50"
                  }`}
              >
                <Card className={plan.popular ? "border-primary/50 bg-primary/5" : ""}>
                  {plan.popular && (
                    <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                      Mais Popular
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((feature, fidx) => (
                        <li key={fidx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Coluna 2: Checkout */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-border shadow-card sticky top-24">
              <CardHeader className="bg-secondary/30">
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <CreditCard className="h-5 w-5 text-primary" /> Finalizar Ativação
                </CardTitle>
                <CardDescription>
                  Selecione o método de pagamento para o {plans.find(p => p.id === selectedPlan)?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubscribe} className="space-y-6">
                  <div className="space-y-4">
                    <Label>Método de Pagamento</Label>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div>
                        <RadioGroupItem value="express" id="express" className="peer sr-only" />
                        <Label
                          htmlFor="express"
                          className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <CreditCard className="mb-3 h-6 w-6" />
                          <span className="text-sm font-semibold">MCX Express</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="transfer" id="transfer" className="peer sr-only" />
                        <Label
                          htmlFor="transfer"
                          className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <Receipt className="mb-3 h-6 w-6" />
                          <span className="text-sm font-semibold">Transferência</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <AnimatePresence mode="wait">
                    {paymentMethod === "express" ? (
                      <motion.div
                        key="mcx"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <Label htmlFor="phone">Número de Telefone associado ao Express</Label>
                        <Input
                          id="phone"
                          placeholder="9XXXXXXXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                        <p className="text-[10px] text-muted-foreground flex gap-1 items-start">
                          <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                          Receberá uma notificação no seu telemóvel para autorizar o pagamento para o número {settings.mcx_express_phone || "923 000 000"}.
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="iba"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <div className="bg-secondary/50 p-4 rounded-lg border border-border space-y-2 text-sm">
                          <p className="font-bold text-primary">Dados Bancários:</p>
                          <p><span className="text-muted-foreground">Banco:</span> {settings.bank_name || "BAI"}</p>
                          <p><span className="text-muted-foreground">IBAN:</span> {settings.bank_iban || "AO06 0040 0000 1234 5678 9012 3"}</p>
                          <p><span className="text-muted-foreground">Titular:</span> {settings.bank_holder || "Saka Service Lda."}</p>
                        </div>
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 text-[11px] text-muted-foreground">
                          <p>Após a transferência, carregue o ficheiro abaixo ou envie para <span className="font-bold">{settings.payment_proof_email || "pagamentos@sakaserv.com"}</span></p>
                        </div>
                        <div className="space-y-2">
                          <Label>Carregar Comprovativo (PDF ou Imagem)</Label>
                          <Input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                            required
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-muted-foreground text-sm">Total a pagar:</span>
                      <span className="text-2xl font-bold text-primary">
                        {plans.find(p => p.id === selectedPlan)?.price}
                      </span>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-hero text-lg py-6 gap-2"
                      disabled={loading}
                    >
                      {loading ? "A processar..." : <><Send className="h-5 w-5" /> Confirmar Pagamento</>}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubscriptionPlans;
