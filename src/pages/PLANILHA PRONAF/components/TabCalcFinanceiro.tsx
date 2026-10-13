import React from 'react';
import { CalculoFinanceiroData, ParametrosCalculoBloco } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calculator, Info, Landmark } from 'lucide-react';

export interface TabCalcFinanceiroProps {
  data: CalculoFinanceiroData;
  onChange: (data: Partial<CalculoFinanceiroData>) => void;
  // Opções opcionais para periodicidade (visaoPER)
  periodicidadeOpcoes?: Array<{ value: string; label: string }>;
}

const DEFAULT_PERIODICIDADES = [
  { value: 'Anual', label: 'Anual' },
  { value: 'Semestral', label: 'Semestral' },
  { value: 'Trimestral', label: 'Trimestral' },
  { value: 'Mensal', label: 'Mensal' },
];

export const TabCalcFinanceiro: React.FC<TabCalcFinanceiroProps> = ({
  data,
  onChange,
  periodicidadeOpcoes = DEFAULT_PERIODICIDADES,
}) => {
  const bloco1 = data?.bloco1 || {
    prazoMeses: 0,
    carenciaMeses: 0,
    jurosPercentAa: 4,
    periodicidadeReembolso: 'Anual',
    amortizacoesIguais: 'Sim',
  };

  const bloco2 = data?.bloco2 || {
    prazoMeses: 0,
    carenciaMeses: 0,
    jurosPercentAa: 4,
    periodicidadeReembolso: 'Anual',
    amortizacoesIguais: 'Sim',
  };

  const handleBloco1Change = <K extends keyof ParametrosCalculoBloco>(
    field: K,
    value: ParametrosCalculoBloco[K]
  ) => {
    onChange({
      bloco1: {
        ...bloco1,
        [field]: value,
      },
    });
  };

  const handleBloco2Change = <K extends keyof ParametrosCalculoBloco>(
    field: K,
    value: ParametrosCalculoBloco[K]
  ) => {
    onChange({
      bloco2: {
        ...bloco2,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner Informativo */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-sm leading-relaxed">
          <p className="font-semibold">Parâmetros de Financiamento</p>
          <p className="text-muted-foreground mt-0.5">
            Os demais campos da aba <strong>Cálculo Financeiro</strong> são calculados automaticamente pelo Excel ao abrir a planilha com as macros habilitadas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BLOCO 1 (Coluna D) */}
        <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Parâmetros de Cálculo — Bloco 1</CardTitle>
                <CardDescription>
                  Condições do financiamento principal (Coluna D: D13 a D17)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* D13 - Prazo em meses */}
            <div>
              <Label htmlFor="bloco1-prazo" className="font-semibold text-xs tracking-wide">
                Prazo em meses *
              </Label>
              <Input
                id="bloco1-prazo"
                type="number"
                min="0"
                step="1"
                value={bloco1.prazoMeses ?? ''}
                placeholder="Ex.: 120"
                onChange={(e) => handleBloco1Change('prazoMeses', parseInt(e.target.value, 10) || 0)}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* D14 - Carência em meses */}
            <div>
              <Label htmlFor="bloco1-carencia" className="font-semibold text-xs tracking-wide">
                Carência em meses *
              </Label>
              <Input
                id="bloco1-carencia"
                type="number"
                min="0"
                step="1"
                value={bloco1.carenciaMeses ?? ''}
                placeholder="Ex.: 36"
                onChange={(e) => handleBloco1Change('carenciaMeses', parseInt(e.target.value, 10) || 0)}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* D15 - Juros % a.a. */}
            <div>
              <Label htmlFor="bloco1-juros" className="font-semibold text-xs tracking-wide">
                Juros % a.a. *
              </Label>
              <Input
                id="bloco1-juros"
                type="number"
                min="0"
                step="0.01"
                value={bloco1.jurosPercentAa ?? 4}
                placeholder="4.00"
                onChange={(e) => handleBloco1Change('jurosPercentAa', parseFloat(e.target.value) || 0)}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* D16 - Periodicidade Reembolso */}
            <div>
              <Label htmlFor="bloco1-periodicidade" className="font-semibold text-xs tracking-wide">
                Periodicidade Reembolso *
              </Label>
              <Select
                value={bloco1.periodicidadeReembolso || 'Anual'}
                onValueChange={(val) => handleBloco1Change('periodicidadeReembolso', val)}
              >
                <SelectTrigger id="bloco1-periodicidade" className="h-10 rounded-xl mt-1.5 bg-background/50">
                  <SelectValue placeholder="Selecione a periodicidade..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {periodicidadeOpcoes.map((opcao) => (
                    <SelectItem key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* D17 - Amortizações iguais ? */}
            <div>
              <Label htmlFor="bloco1-amortizacoes" className="font-semibold text-xs tracking-wide">
                Amortizações iguais? *
              </Label>
              <Select
                value={bloco1.amortizacoesIguais || 'Sim'}
                onValueChange={(val: 'Sim' | 'Não') => handleBloco1Change('amortizacoesIguais', val)}
              >
                <SelectTrigger id="bloco1-amortizacoes" className="h-10 rounded-xl mt-1.5 bg-background/50">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* BLOCO 2 (Coluna DD) */}
        <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Parâmetros de Cálculo — Bloco 2</CardTitle>
                <CardDescription>
                  Condições do financiamento secundário (Coluna DD: DD13 a DD17)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* DD13 - Prazo em meses */}
            <div>
              <Label htmlFor="bloco2-prazo" className="font-semibold text-xs tracking-wide">
                Prazo em meses *
              </Label>
              <Input
                id="bloco2-prazo"
                type="number"
                min="0"
                step="1"
                value={bloco2.prazoMeses ?? ''}
                placeholder="Ex.: 120"
                onChange={(e) => handleBloco2Change('prazoMeses', parseInt(e.target.value, 10) || 0)}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* DD14 - Carência em meses */}
            <div>
              <Label htmlFor="bloco2-carencia" className="font-semibold text-xs tracking-wide">
                Carência em meses *
              </Label>
              <Input
                id="bloco2-carencia"
                type="number"
                min="0"
                step="1"
                value={bloco2.carenciaMeses ?? ''}
                placeholder="Ex.: 36"
                onChange={(e) => handleBloco2Change('carenciaMeses', parseInt(e.target.value, 10) || 0)}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* DD15 - Juros % a.a. */}
            <div>
              <Label htmlFor="bloco2-juros" className="font-semibold text-xs tracking-wide">
                Juros % a.a. *
              </Label>
              <Input
                id="bloco2-juros"
                type="number"
                min="0"
                step="0.01"
                value={bloco2.jurosPercentAa ?? 4}
                placeholder="4.00"
                onChange={(e) => handleBloco2Change('jurosPercentAa', parseFloat(e.target.value) || 0)}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* DD16 - Periodicidade Reembolso */}
            <div>
              <Label htmlFor="bloco2-periodicidade" className="font-semibold text-xs tracking-wide">
                Periodicidade Reembolso *
              </Label>
              <Select
                value={bloco2.periodicidadeReembolso || 'Anual'}
                onValueChange={(val) => handleBloco2Change('periodicidadeReembolso', val)}
              >
                <SelectTrigger id="bloco2-periodicidade" className="h-10 rounded-xl mt-1.5 bg-background/50">
                  <SelectValue placeholder="Selecione a periodicidade..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {periodicidadeOpcoes.map((opcao) => (
                    <SelectItem key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DD17 - Amortizações iguais ? */}
            <div>
              <Label htmlFor="bloco2-amortizacoes" className="font-semibold text-xs tracking-wide">
                Amortizações iguais? *
              </Label>
              <Select
                value={bloco2.amortizacoesIguais || 'Sim'}
                onValueChange={(val: 'Sim' | 'Não') => handleBloco2Change('amortizacoesIguais', val)}
              >
                <SelectTrigger id="bloco2-amortizacoes" className="h-10 rounded-xl mt-1.5 bg-background/50">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TabCalcFinanceiro;
