import { useState } from "react";
import { useStockProposals } from "@/hooks/useStockProposals";
import { InsertStockProposal, StockProposal } from "@/types/stock";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Box, Calendar, FileText, Trash2, User, Landmark, ChevronDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useProposals } from "@/hooks/useProposals";
import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StockProposals() {
  const { proposals, loading, addProposal, deleteProposal } = useStockProposals();
  const { proposals: allProposals } = useProposals();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertStockProposal>>({
    producer_name: "",
    producer_cpf: "",
    credit_program: "",
    estimated_value: 0,
    notes: ""
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const uniquePrograms = useMemo(() => {
    const progs = new Set(allProposals.map(p => p.credit_program).filter(Boolean) as string[]);
    return Array.from(progs).sort();
  }, [allProposals]);

  const handleCreate = async () => {
    if (!formData.producer_name) return;
    setIsSubmitting(true);
    
    // Default form data fallback
    const newProposal: InsertStockProposal = {
      producer_name: formData.producer_name,
      producer_cpf: formData.producer_cpf || null,
      credit_program: formData.credit_program || null,
      estimated_value: formData.estimated_value || 0,
      notes: formData.notes || null,
      status: "novo",
    };

    const res = await addProposal(newProposal);
    if (res) {
      setIsDialogOpen(false);
      setFormData({ producer_name: "", producer_cpf: "", credit_program: "", estimated_value: 0, notes: "" });
    }
    setIsSubmitting(false);
  };

  const totalEstimated = proposals.reduce((acc, p) => acc + (Number(p.estimated_value) || 0), 0);

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 font-heading tracking-tight flex items-center gap-3">
            <Box className="h-8 w-8 text-indigo-600" />
            Propostas em Estoque
          </h1>
          <p className="text-muted-foreground mt-1">
            Controle de propostas em estágio inicial, antes do envio para a central.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold tracking-wide shadow-md shadow-indigo-200">
              <Plus className="mr-2 h-4 w-4" />
              Nova Proposta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-indigo-900">
                <Box className="h-5 w-5" />
                Nova Proposta no Estoque
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produtor *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    className="pl-9" 
                    placeholder="Ex: João da Silva" 
                    value={formData.producer_name}
                    onChange={(e) => setFormData({...formData, producer_name: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input 
                    id="cpf" 
                    placeholder="000.000.000-00" 
                    value={formData.producer_cpf || ""}
                    onChange={(e) => setFormData({...formData, producer_cpf: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Valor Estimado</Label>
                  <Input 
                    id="value" 
                    type="number"
                    placeholder="R$ 0,00" 
                    value={formData.estimated_value || ""}
                    onChange={(e) => setFormData({...formData, estimated_value: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="program">Programa de Crédito</Label>
                <Select 
                  value={formData.credit_program || ""} 
                  onValueChange={(v) => setFormData({...formData, credit_program: v})}
                >
                  <SelectTrigger id="program" className="rounded-xl h-10 bg-white/50 border-slate-200">
                    <div className="flex items-center gap-3">
                      <Landmark className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Selecione o programa" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-[200px]">
                    {uniquePrograms.length > 0 ? (
                      uniquePrograms.map(program => (
                        <SelectItem key={program} value={program} className="rounded-lg py-2.5">
                          {program}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground uppercase font-black tracking-widest">
                        Nenhum programa encontrado
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <textarea 
                    id="notes" 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-9 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
                    placeholder="Anotações adicionais..."
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button 
                onClick={handleCreate} 
                disabled={!formData.producer_name || isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar no Estoque
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Box className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-600/80 uppercase tracking-wider">Total em Estoque</p>
                <h3 className="text-3xl font-black text-indigo-900 font-heading">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : proposals.length}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Landmark className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-600/80 uppercase tracking-wider">Volume Financeiro Estimado</p>
                <h3 className="text-3xl font-black text-emerald-900 font-heading">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatCurrency(totalEstimated)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="shadow-md border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-500" />
            Relação de Estoque
          </CardTitle>
          <CardDescription>
            Listagem de todas as propostas pré-cadastradas na agência.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : proposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Box className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">O estoque está vazio</h3>
              <p className="text-slate-500 mt-1 max-w-sm">
                Nenhuma proposta foi registrada no estoque. Clique no botão "Nova Proposta" para começar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {proposals.map((proposal) => (
                <div 
                  key={proposal.id} 
                  className="group relative bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if(confirm('Tem certeza que deseja remover esta proposta do estoque?')) {
                          deleteProposal(proposal.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-start justify-between mb-4 pr-8">
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-1">
                        {proposal.producer_name}
                      </h4>
                      {proposal.producer_cpf && (
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{proposal.producer_cpf}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Landmark className="h-3.5 w-3.5" /> Programa
                      </span>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-semibold">
                        {proposal.credit_program || "Não informado"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Box className="h-3.5 w-3.5" /> Valor Estimado
                      </span>
                      <span className="font-black text-slate-900">
                        {proposal.estimated_value ? formatCurrency(Number(proposal.estimated_value)) : "R$ 0,00"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1.5 text-xs">
                        <Calendar className="h-3 w-3" /> 
                        {format(parseISO(proposal.created_at), "dd/MM/yyyy")}
                      </span>
                      <Badge className="bg-indigo-50 text-indigo-700 capitalize text-[10px] px-1.5 py-0 hover:bg-indigo-100">
                        {proposal.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
