import React from 'react';
import { CalculoFinanceiroData, ParametrosCalculoBloco } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calculator, Info, Landmark, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { identificarParametrosPorPrograma, validarParametrosCalculo } from '../programasCredito';

export interface TabCalcFinanceiroProps {
  data: CalculoFinanceiroData;
  onChange: (data: Partial<CalculoFinanceiroData>) => void;
  programaSelecionado?: string;
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
  programaSelecionado = '',
  periodicidadeOpcoes = DEFAULT_PERIODICIDADES,
}) => {
  const paramProg = React.useMemo(() => {
    return identificarParametrosPorPrograma(programaSelecionado);
  }, [programaSelecionado]);

  // Se bloco1 ou bloco2 estiverem vazios / zerados, inicializa ou usa padrões do programa
  const bloco1 = React.useMemo(() => {
    const raw = data?.bloco1;
    return {
      prazoMeses: raw?.prazoMeses ? Number(raw.prazoMeses) : paramProg.prazoMeses,
      carenciaMeses: raw?.carenciaMeses !== undefined && raw.carenciaMeses !== null && raw.carenciaMeses !== 0
        ? Number(raw.carenciaMeses)
        : (raw?.prazoMeses ? 0 : paramProg.carenciaMeses),
      jurosPercentAa: raw?.jurosPercentAa !== undefined && raw.jurosPercentAa !== null
        ? Number(raw.jurosPercentAa)
        : paramProg.jurosPercentAa,
      periodicidadeReembolso: raw?.periodicidadeReembolso || paramProg.periodicidadeReembolso,
      amortizacoesIguais: (raw?.amortizacoesIguais as 'Sim' | 'Não') || paramProg.amortizacoesIguais,
    };
  }, [data?.bloco1, paramProg]);

  const bloco2 = React.useMemo(() => {
    const raw = data?.bloco2;
    return {
      prazoMeses: raw?.prazoMeses ? Number(raw.prazoMeses) : bloco1.prazoMeses,
      carenciaMeses: raw?.carenciaMeses !== undefined && raw.carenciaMeses !== null && raw.carenciaMeses !== 0
        ? Number(raw.carenciaMeses)
        : bloco1.carenciaMeses,
      jurosPercentAa: raw?.jurosPercentAa !== undefined && raw.jurosPercentAa !== null
        ? Number(raw.jurosPercentAa)
        : bloco1.jurosPercentAa,
      periodicidadeReembolso: raw?.periodicidadeReembolso || bloco1.periodicidadeReembolso,
      amortizacoesIguais: (raw?.amortizacoesIguais as 'Sim' | 'Não') || bloco1.amortizacoesIguais,
    };
  }, [data?.bloco2, bloco1]);

  const valBloco1 = React.useMemo(() => {
    return validarParametrosCalculo(bloco1.prazoMeses, bloco1.carenciaMeses, programaSelecionado);
  }, [bloco1.prazoMeses, bloco1.carenciaMeses, programaSelecionado]);

  const valBloco2 = React.useMemo(() => {
    return validarParametrosCalculo(bloco2.prazoMeses, bloco2.carenciaMeses, programaSelecionado);
  }, [bloco2.prazoMeses, bloco2.carenciaMeses, programaSelecionado]);

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

  // Aplica os parâmetros oficiais recomendados do programa de crédito a ambos os blocos
  const handleAplicarParametrosPrograma = () => {
    onChange({
      bloco1: {
        prazoMeses: paramProg.prazoMeses,
        carenciaMeses: paramProg.carenciaMeses,
        jurosPercentAa: paramProg.jurosPercentAa,
        periodicidadeReembolso: paramProg.periodicidadeReembolso,
        amortizacoesIguais: paramProg.amortizacoesIguais,
      },
      bloco2: {
        prazoMeses: paramProg.prazoMeses,
        carenciaMeses: paramProg.carenciaMeses,
        jurosPercentAa: paramProg.jurosPercentAa,
        periodicidadeReembolso: paramProg.periodicidadeReembolso,
        amortizacoesIguais: paramProg.amortizacoesIguais,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner Informativo e Identificação Automática pelo Programa de Crédito */}
      <div className="p-5 rounded-3xl bg-card/60 backdrop-blur-xl border border-primary/20 shadow-premium space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Identificação Automática
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  Parâmetros Vinculados
                </span>
              </div>
              <p className="text-base font-bold text-foreground mt-0.5">
                Programa: {programaSelecionado || paramProg.nome}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Condições oficiais do BNB: Prazo de até <strong>{paramProg.prazoMeses} meses ({paramProg.prazoMeses / 12} anos)</strong>, Carência de até <strong>{paramProg.carenciaMeses} meses ({paramProg.carenciaMeses / 12} anos)</strong> e Juros de <strong>{paramProg.jurosPercentAa}% a.a.</strong>
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAplicarParametrosPrograma}
            className="rounded-2xl gap-2 font-medium border-primary/30 hover:bg-primary/10 text-primary self-start md:self-center shrink-0"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            Preencher com Padrões do Programa
          </Button>
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
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="bloco1-prazo" className="font-semibold text-xs tracking-wide">
                  Prazo em meses *
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Máx: {paramProg.prazoMeses} meses ({paramProg.prazoMeses / 12} anos)
                </span>
              </div>
              <Input
                id="bloco1-prazo"
                type="number"
                min="0"
                step="12"
                value={Number(bloco1.prazoMeses) || ''}
                placeholder={`Ex.: ${paramProg.prazoMeses}`}
                onChange={(e) => handleBloco1Change('prazoMeses', parseInt(e.target.value, 10) || 0)}
                className="h-10 rounded-xl bg-background/50 font-mono text-sm"
              />
            </div>

            {/* D14 - Carência em meses */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="bloco1-carencia" className="font-semibold text-xs tracking-wide">
                  Carência em meses *
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Máx: {paramProg.carenciaMeses} meses ({paramProg.carenciaMeses / 12} anos)
                </span>
              </div>
              <Input
                id="bloco1-carencia"
                type="number"
                min="0"
                step="1"
                value={Number(bloco1.carenciaMeses) || ''}
                placeholder={`Ex.: ${paramProg.carenciaMeses}`}
                onChange={(e) => handleBloco1Change('carenciaMeses', parseInt(e.target.value, 10) || 0)}
                className="h-10 rounded-xl bg-background/50 font-mono text-sm"
              />
            </div>

            {/* D15 - Juros % a.a. */}
            <div className="space-y-1.5">
              <Label htmlFor="bloco1-juros" className="font-semibold text-xs tracking-wide">
                Juros % a.a. *
              </Label>
              <Input
                id="bloco1-juros"
                type="number"
                min="0"
                step="0.01"
                value={bloco1.jurosPercentAa ?? paramProg.jurosPercentAa}
                placeholder="Ex.: 0.5"
                onChange={(e) => handleBloco1Change('jurosPercentAa', parseFloat(e.target.value) || 0)}
                className="h-10 rounded-xl bg-background/50 font-mono text-sm"
              />
            </div>

            {/* D16 - Periodicidade Reembolso */}
            <div className="space-y-1.5">
              <Label htmlFor="bloco1-periodicidade" className="font-semibold text-xs tracking-wide">
                Periodicidade Reembolso *
              </Label>
              <Select
                value={bloco1.periodicidadeReembolso || 'Anual'}
                onValueChange={(val) => handleBloco1Change('periodicidadeReembolso', val)}
              >
                <SelectTrigger id="bloco1-periodicidade" className="h-10 rounded-xl bg-background/50">
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
            <div className="space-y-1.5">
              <Label htmlFor="bloco1-amortizacoes" className="font-semibold text-xs tracking-wide">
                Amortizações iguais? *
              </Label>
              <Select
                value={bloco1.amortizacoesIguais || 'Sim'}
                onValueChange={(val: 'Sim' | 'Não') => handleBloco1Change('amortizacoesIguais', val)}
              >
                <SelectTrigger id="bloco1-amortizacoes" className="h-10 rounded-xl bg-background/50">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alertas / Validações do Bloco 1 */}
            {valBloco1.erros.length > 0 && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
                {valBloco1.erros.map((err, i) => (
                  <p key={i} className="flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {err}
                  </p>
                ))}
              </div>
            )}
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
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="bloco2-prazo" className="font-semibold text-xs tracking-wide">
                  Prazo em meses *
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Máx: {paramProg.prazoMeses} meses ({paramProg.prazoMeses / 12} anos)
                </span>
              </div>
              <Input
                id="bloco2-prazo"
                type="number"
                min="0"
                step="12"
                value={Number(bloco2.prazoMeses) || ''}
                placeholder={`Ex.: ${paramProg.prazoMeses}`}
                onChange={(e) => handleBloco2Change('prazoMeses', parseInt(e.target.value, 10) || 0)}
                className="h-10 rounded-xl bg-background/50 font-mono text-sm"
              />
            </div>

            {/* DD14 - Carência em meses */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="bloco2-carencia" className="font-semibold text-xs tracking-wide">
                  Carência em meses *
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Máx: {paramProg.carenciaMeses} meses ({paramProg.carenciaMeses / 12} anos)
                </span>
              </div>
              <Input
                id="bloco2-carencia"
                type="number"
                min="0"
                step="1"
                value={Number(bloco2.carenciaMeses) || ''}
                placeholder={`Ex.: ${paramProg.carenciaMeses}`}
                onChange={(e) => handleBloco2Change('carenciaMeses', parseInt(e.target.value, 10) || 0)}
                className="h-10 rounded-xl bg-background/50 font-mono text-sm"
              />
            </div>

            {/* DD15 - Juros % a.a. */}
            <div className="space-y-1.5">
              <Label htmlFor="bloco2-juros" className="font-semibold text-xs tracking-wide">
                Juros % a.a. *
              </Label>
              <Input
                id="bloco2-juros"
                type="number"
                min="0"
                step="0.01"
                value={bloco2.jurosPercentAa ?? paramProg.jurosPercentAa}
                placeholder="Ex.: 0.5"
                onChange={(e) => handleBloco2Change('jurosPercentAa', parseFloat(e.target.value) || 0)}
                className="h-10 rounded-xl bg-background/50 font-mono text-sm"
              />
            </div>

            {/* DD16 - Periodicidade Reembolso */}
            <div className="space-y-1.5">
              <Label htmlFor="bloco2-periodicidade" className="font-semibold text-xs tracking-wide">
                Periodicidade Reembolso *
              </Label>
              <Select
                value={bloco2.periodicidadeReembolso || 'Anual'}
                onValueChange={(val) => handleBloco2Change('periodicidadeReembolso', val)}
              >
                <SelectTrigger id="bloco2-periodicidade" className="h-10 rounded-xl bg-background/50">
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
            <div className="space-y-1.5">
              <Label htmlFor="bloco2-amortizacoes" className="font-semibold text-xs tracking-wide">
                Amortizações iguais? *
              </Label>
              <Select
                value={bloco2.amortizacoesIguais || 'Sim'}
                onValueChange={(val: 'Sim' | 'Não') => handleBloco2Change('amortizacoesIguais', val)}
              >
                <SelectTrigger id="bloco2-amortizacoes" className="h-10 rounded-xl bg-background/50">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alertas / Validações do Bloco 2 */}
            {valBloco2.erros.length > 0 && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
                {valBloco2.erros.map((err, i) => (
                  <p key={i} className="flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {err}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TabCalcFinanceiro;
