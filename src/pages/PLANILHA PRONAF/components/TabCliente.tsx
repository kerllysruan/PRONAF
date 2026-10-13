import React from 'react';
import { ClienteData, SocioData } from '../types';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, User, MapPin, Building, Heart, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabClienteProps {
  data: ClienteData;
  onChange: (data: Partial<ClienteData>) => void;
  // Listas de referência opcionais (podem vir de useReferenceTables)
  tiposDocumento?: SelectOption[];
  ufs?: SelectOption[];
  municipios?: SelectOption[];
  estadosCivis?: SelectOption[];
  escolaridades?: SelectOption[];
  profissoes?: SelectOption[];
  atividades?: SelectOption[];
  politicasPublicas?: SelectOption[];
  portes?: SelectOption[];
  tiposLogradouro?: SelectOption[];
  tiposPosse?: SelectOption[];
}

export const TabCliente: React.FC<TabClienteProps> = ({
  data,
  onChange,
  tiposDocumento = [],
  ufs = [],
  municipios = [],
  estadosCivis = [],
  escolaridades = [],
  profissoes = [],
  atividades = [],
  politicasPublicas = [],
  portes = [],
  tiposLogradouro = [],
  tiposPosse = [],
}) => {
  const isPessoaJuridica = data.tipoCliente === 'Pessoa Jurídica';

  // Copia os dados do endereço da atividade para o endereço de correspondência
  const handleCopiarEndereco = () => {
    onChange({
      corrTipoLogradouro: data.ativTipoLogradouro,
      corrEndereco: data.ativEndereco,
      corrNumero: data.ativNumero,
      corrComplemento: data.ativComplemento,
      corrBairro: data.ativBairro,
      corrCep: data.ativCep,
      corrMunicipio: data.ativMunicipio,
      corrDddTelefone: data.ativDddTelefone,
      corrNumTelefone: data.ativNumTelefone,
    });
  };

  const handleSocioChange = (index: number, field: keyof SocioData, value: string) => {
    const updatedSocios = [...(data.socios || [])];
    while (updatedSocios.length <= index) {
      updatedSocios.push({ cpfCnpj: '', nome: '', participacao: '', representaEmpresa: '' });
    }
    updatedSocios[index] = {
      ...updatedSocios[index],
      [field]: value,
    };
    onChange({ socios: updatedSocios });
  };

  return (
    <div className="space-y-6">
      {/* SEÇÃO A: DADOS CADASTRAIS DO(A) CLIENTE */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">A. Dados Cadastrais do(a) Cliente</CardTitle>
              <CardDescription>
                Informações principais de identificação (E12 a E37)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* E12 - Tipo Cliente */}
            <div>
              <Label htmlFor="tipoCliente" className="font-semibold text-xs tracking-wide">
                Tipo Cliente *
              </Label>
              <Select
                value={data.tipoCliente || 'Pessoa Física'}
                onValueChange={(val: 'Pessoa Física' | 'Pessoa Jurídica') =>
                  onChange({ tipoCliente: val })
                }
              >
                <SelectTrigger id="tipoCliente" className="h-10 rounded-xl mt-1.5 bg-background/50">
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Pessoa Física">Pessoa Física</SelectItem>
                  <SelectItem value="Pessoa Jurídica">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* E13 - Nome / Razão Social */}
            <div className="md:col-span-2">
              <Label htmlFor="nome" className="font-semibold text-xs tracking-wide">
                {isPessoaJuridica ? 'Razão Social *' : 'Nome *'}
              </Label>
              <Input
                id="nome"
                value={data.nome || ''}
                maxLength={55}
                placeholder={isPessoaJuridica ? 'Razão Social completa' : 'Nome completo'}
                onChange={(e) => onChange({ nome: e.target.value })}
                className={cn(
                  'h-10 rounded-xl mt-1.5 bg-background/50',
                  !data.nome && 'border-destructive/60 focus-visible:ring-destructive'
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* E14 - Apelido / Nome Fantasia */}
            <div>
              <Label htmlFor="apelido" className="text-xs">
                {isPessoaJuridica ? 'Nome de Fantasia' : 'Apelido'}
              </Label>
              <Input
                id="apelido"
                value={data.apelido || ''}
                maxLength={20}
                placeholder={isPessoaJuridica ? 'Nome Fantasia' : 'Apelido'}
                onChange={(e) => onChange({ apelido: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* E15 - CPF / CNPJ */}
            <div>
              <Label htmlFor="cpf" className="font-semibold text-xs tracking-wide">
                {isPessoaJuridica ? 'C.N.P.J. *' : 'C.P.F. *'}
              </Label>
              <Input
                id="cpf"
                value={data.cpf || ''}
                placeholder={isPessoaJuridica ? '00.000.000/0000-00' : '000.000.000-00'}
                onChange={(e) => onChange({ cpf: e.target.value })}
                className={cn(
                  'h-10 rounded-xl mt-1.5 bg-background/50',
                  !data.cpf && 'border-destructive/60 focus-visible:ring-destructive'
                )}
              />
            </div>

            {/* E16 - Data de Nascimento / Constituição */}
            <div>
              <Label htmlFor="dataNascimento" className="font-semibold text-xs tracking-wide">
                {isPessoaJuridica ? 'Data de Constituição *' : 'Data de Nascimento *'}
              </Label>
              <Input
                id="dataNascimento"
                type="date"
                value={data.dataNascimento || ''}
                onChange={(e) => onChange({ dataNascimento: e.target.value })}
                className={cn(
                  'h-10 rounded-xl mt-1.5 bg-background/50',
                  !data.dataNascimento && 'border-destructive/60 focus-visible:ring-destructive'
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* E20 - Tipo de Documento */}
            <div>
              <Label htmlFor="tipoDocumento" className="font-semibold text-xs tracking-wide">
                Tipo de Documento *
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="tipoDocumento"
                  options={tiposDocumento}
                  value={data.tipoDocumento || ''}
                  onChange={(val) => onChange({ tipoDocumento: val })}
                  placeholder="Selecione o documento..."
                  className={!data.tipoDocumento ? 'border-destructive/60' : ''}
                />
              </div>
            </div>

            {/* E17 - Nº do Documento / Inscrição Estadual */}
            <div>
              <Label htmlFor="numDocumento" className="font-semibold text-xs tracking-wide">
                {isPessoaJuridica ? 'Inscrição Estadual *' : 'Nº do Documento *'}
              </Label>
              <Input
                id="numDocumento"
                value={data.numDocumento || ''}
                placeholder="Número do documento"
                onChange={(e) => onChange({ numDocumento: e.target.value })}
                className={cn(
                  'h-10 rounded-xl mt-1.5 bg-background/50',
                  !data.numDocumento && 'border-destructive/60 focus-visible:ring-destructive'
                )}
              />
            </div>

            {/* E21 - Órgão Emissor */}
            <div>
              <Label htmlFor="orgaoEmissorDoc" className="font-semibold text-xs tracking-wide">
                Órgão Emissor Docum. *
              </Label>
              <Input
                id="orgaoEmissorDoc"
                value={data.orgaoEmissorDoc || ''}
                placeholder="Ex.: SSP"
                onChange={(e) => onChange({ orgaoEmissorDoc: e.target.value })}
                className={cn(
                  'h-10 rounded-xl mt-1.5 bg-background/50',
                  !data.orgaoEmissorDoc && 'border-destructive/60 focus-visible:ring-destructive'
                )}
              />
            </div>

            {/* E22 - UF Órgão Emissor */}
            <div>
              <Label htmlFor="ufOrgaoEmissorDoc" className="font-semibold text-xs tracking-wide">
                UF Órgão Emissor *
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="ufOrgaoEmissorDoc"
                  options={ufs}
                  value={data.ufOrgaoEmissorDoc || ''}
                  onChange={(val) => onChange({ ufOrgaoEmissorDoc: val })}
                  placeholder="Selecione a UF..."
                  className={!data.ufOrgaoEmissorDoc ? 'border-destructive/60' : ''}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* E18 - Data de Emissão Docum. */}
            <div>
              <Label htmlFor="dataEmissaoDoc" className="text-xs">
                {isPessoaJuridica ? 'Data da Inscrição' : 'Data de Emissão Docum.'}
              </Label>
              <Input
                id="dataEmissaoDoc"
                type="date"
                value={data.dataEmissaoDoc || ''}
                onChange={(e) => onChange({ dataEmissaoDoc: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* E23 - Título Eleitoral */}
            <div>
              <Label htmlFor="tituloEleitoral" className="text-xs">
                Título Eleitoral
              </Label>
              <Input
                id="tituloEleitoral"
                value={data.tituloEleitoral || ''}
                placeholder="Nº Título Eleitoral"
                onChange={(e) => onChange({ tituloEleitoral: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* E24 - Naturalidade */}
            <div>
              <Label htmlFor="naturalidade" className="font-semibold text-xs tracking-wide">
                Naturalidade *
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="naturalidade"
                  options={municipios}
                  value={data.naturalidade || ''}
                  onChange={(val) => onChange({ naturalidade: val })}
                  placeholder="Selecione o município..."
                  className={!data.naturalidade ? 'border-destructive/60' : ''}
                />
              </div>
            </div>

            {/* E25 - Sexo */}
            <div>
              <Label htmlFor="sexo" className="font-semibold text-xs tracking-wide">
                Sexo *
              </Label>
              <Select
                value={data.sexo || ''}
                onValueChange={(val: 'Masculino' | 'Feminino') => onChange({ sexo: val })}
              >
                <SelectTrigger
                  id="sexo"
                  className={cn(
                    'h-10 rounded-xl mt-1.5 bg-background/50',
                    !data.sexo && 'border-destructive/60'
                  )}
                >
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* E26 - Estado Civil */}
            <div>
              <Label htmlFor="estadoCivil" className="font-semibold text-xs tracking-wide">
                Estado Civil *
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="estadoCivil"
                  options={estadosCivis}
                  value={data.estadoCivil || ''}
                  onChange={(val) => onChange({ estadoCivil: val })}
                  placeholder="Selecione..."
                  className={!data.estadoCivil ? 'border-destructive/60' : ''}
                />
              </div>
            </div>

            {/* E27 - Grau de Instrução */}
            <div>
              <Label htmlFor="grauInstrucao" className="text-xs">
                Grau de Instrução
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="grauInstrucao"
                  options={escolaridades}
                  value={data.grauInstrucao || ''}
                  onChange={(val) => onChange({ grauInstrucao: val })}
                  placeholder="Selecione..."
                />
              </div>
            </div>

            {/* E28 - Profissão */}
            <div>
              <Label htmlFor="profissao" className="text-xs">
                Profissão
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="profissao"
                  options={profissoes}
                  value={data.profissao || ''}
                  onChange={(val) => onChange({ profissao: val })}
                  placeholder="Selecione..."
                />
              </div>
            </div>

            {/* E29 - Atividade */}
            <div>
              <Label htmlFor="atividade" className="font-semibold text-xs tracking-wide">
                Atividade *
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="atividade"
                  options={atividades}
                  value={data.atividade || ''}
                  onChange={(val) => onChange({ atividade: val })}
                  placeholder="Selecione a atividade..."
                  className={!data.atividade ? 'border-destructive/60' : ''}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* E30 - Renda Mensal / Capital Social */}
            <div>
              <Label htmlFor="rendaMensal" className="font-semibold text-xs tracking-wide">
                {isPessoaJuridica ? 'Capital Social (R$) *' : 'Renda Mensal (R$) *'}
              </Label>
              <Input
                id="rendaMensal"
                type="number"
                min="0"
                step="0.01"
                value={data.rendaMensal ?? ''}
                placeholder="0,00"
                onChange={(e) => onChange({ rendaMensal: parseFloat(e.target.value) || 0 })}
                className={cn(
                  'h-10 rounded-xl mt-1.5 bg-background/50',
                  (data.rendaMensal === undefined || data.rendaMensal === null) &&
                    'border-destructive/60 focus-visible:ring-destructive'
                )}
              />
            </div>

            {/* E31 - Beneficiário Políticas Públicas */}
            <div>
              <Label htmlFor="beneficiarioPoliticasPublicas" className="font-semibold text-xs tracking-wide">
                Beneficiário Polít. Públicas *
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="beneficiarioPoliticasPublicas"
                  options={politicasPublicas}
                  value={data.beneficiarioPoliticasPublicas || ''}
                  onChange={(val) => onChange({ beneficiarioPoliticasPublicas: val })}
                  placeholder="Selecione..."
                  className={!data.beneficiarioPoliticasPublicas ? 'border-destructive/60' : ''}
                />
              </div>
            </div>

            {/* E35 - Porte */}
            <div>
              <Label htmlFor="porte" className="font-semibold text-xs tracking-wide">
                Porte *
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="porte"
                  options={portes}
                  value={data.porte || ''}
                  onChange={(val) => onChange({ porte: val })}
                  placeholder="Selecione..."
                  className={!data.porte ? 'border-destructive/60' : ''}
                />
              </div>
            </div>

            {/* E36 - Nº da DAP */}
            <div>
              <Label htmlFor="numDap" className="font-semibold text-xs tracking-wide">
                Nº da DAP / CAF *
              </Label>
              <Input
                id="numDap"
                value={data.numDap || ''}
                placeholder="Número da DAP/CAF"
                onChange={(e) => onChange({ numDap: e.target.value })}
                className={cn(
                  'h-10 rounded-xl mt-1.5 bg-background/50',
                  !data.numDap && 'border-destructive/60 focus-visible:ring-destructive'
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* E32 - Nome do Pai */}
            <div>
              <Label htmlFor="nomePai" className="text-xs">
                Nome do Pai
              </Label>
              <Input
                id="nomePai"
                value={data.nomePai || ''}
                maxLength={55}
                placeholder="Nome do pai"
                onChange={(e) => onChange({ nomePai: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* E33 - Nome da Mãe */}
            <div>
              <Label htmlFor="nomeMae" className="font-semibold text-xs tracking-wide">
                Nome da Mãe *
              </Label>
              <Input
                id="nomeMae"
                value={data.nomeMae || ''}
                maxLength={55}
                placeholder="Nome da mãe"
                onChange={(e) => onChange({ nomeMae: e.target.value })}
                className={cn(
                  'h-10 rounded-xl mt-1.5 bg-background/50',
                  !data.nomeMae && 'border-destructive/60 focus-visible:ring-destructive'
                )}
              />
            </div>

            {/* E37 - Capital Integralizado */}
            <div>
              <Label htmlFor="capitalIntegralizado" className="text-xs">
                Capital Integralizado
              </Label>
              <Input
                id="capitalIntegralizado"
                value={data.capitalIntegralizado || ''}
                placeholder="Valor ou descrição"
                onChange={(e) => onChange({ capitalIntegralizado: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO B: ENDEREÇO DA ATIVIDADE */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">B. Endereço da Atividade</CardTitle>
              <CardDescription>
                Local onde a atividade rural é exercida (E44 a E52)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* E44 - Tipo de Logradouro */}
            <div>
              <Label htmlFor="ativTipoLogradouro" className="font-semibold text-xs tracking-wide">
                Tipo de Logradouro *
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="ativTipoLogradouro"
                  options={tiposLogradouro}
                  value={data.ativTipoLogradouro || ''}
                  onChange={(val) => onChange({ ativTipoLogradouro: val })}
                  placeholder="Selecione..."
                  className={!data.ativTipoLogradouro ? 'border-destructive/60' : ''}
                />
              </div>
            </div>

            {/* E45 - Endereço */}
            <div className="md:col-span-2">
              <Label htmlFor="ativEndereco" className="font-semibold text-xs tracking-wide">
                Endereço *
              </Label>
              <Input
                id="ativEndereco"
                value={data.ativEndereco || ''}
                maxLength={45}
                placeholder="Nome da rua, estrada ou fazenda"
                onChange={(e) => onChange({ ativEndereco: e.target.value })}
                className={cn(
                  'h-10 rounded-xl mt-1.5 bg-background/50',
                  !data.ativEndereco && 'border-destructive/60 focus-visible:ring-destructive'
                )}
              />
            </div>

            {/* E46 - Nº */}
            <div>
              <Label htmlFor="ativNumero" className="font-semibold text-xs tracking-wide">
                Nº * (ou S/N)
              </Label>
              <Input
                id="ativNumero"
                value={data.ativNumero || ''}
                placeholder="Ex.: 120 ou S/N"
                onChange={(e) => onChange({ ativNumero: e.target.value })}
                className={cn(
                  'h-10 rounded-xl mt-1.5 bg-background/50',
                  !data.ativNumero && 'border-destructive/60 focus-visible:ring-destructive'
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* E47 - Complemento */}
            <div>
              <Label htmlFor="ativComplemento" className="text-xs">
                Complemento
              </Label>
              <Input
                id="ativComplemento"
                value={data.ativComplemento || ''}
                placeholder="Apto, Bloco, Km"
                onChange={(e) => onChange({ ativComplemento: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* E48 - Bairro */}
            <div>
              <Label htmlFor="ativBairro" className="font-semibold text-xs tracking-wide">
                Bairro / Povoado *
              </Label>
              <Input
                id="ativBairro"
                value={data.ativBairro || ''}
                placeholder="Nome do bairro"
                onChange={(e) => onChange({ ativBairro: e.target.value })}
                className={cn(
                  'h-10 rounded-xl mt-1.5 bg-background/50',
                  !data.ativBairro && 'border-destructive/60 focus-visible:ring-destructive'
                )}
              />
            </div>

            {/* E49 - CEP */}
            <div>
              <Label htmlFor="ativCep" className="font-semibold text-xs tracking-wide">
                CEP *
              </Label>
              <Input
                id="ativCep"
                value={data.ativCep || ''}
                placeholder="00000-000"
                onChange={(e) => onChange({ ativCep: e.target.value })}
                className={cn(
                  'h-10 rounded-xl mt-1.5 bg-background/50',
                  !data.ativCep && 'border-destructive/60 focus-visible:ring-destructive'
                )}
              />
            </div>

            {/* E50 - Município */}
            <div>
              <Label htmlFor="ativMunicipio" className="font-semibold text-xs tracking-wide">
                Município *
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="ativMunicipio"
                  options={municipios}
                  value={data.ativMunicipio || ''}
                  onChange={(val) => onChange({ ativMunicipio: val })}
                  placeholder="Selecione..."
                  className={!data.ativMunicipio ? 'border-destructive/60' : ''}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* E51 - DDD Telefone */}
            <div>
              <Label htmlFor="ativDddTelefone" className="text-xs">
                DDD Telefone
              </Label>
              <Input
                id="ativDddTelefone"
                value={data.ativDddTelefone || ''}
                maxLength={4}
                placeholder="Ex.: 85"
                onChange={(e) => onChange({ ativDddTelefone: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* E52 - Nº Telefone */}
            <div>
              <Label htmlFor="ativNumTelefone" className="text-xs">
                Nº Telefone
              </Label>
              <Input
                id="ativNumTelefone"
                value={data.ativNumTelefone || ''}
                maxLength={9}
                placeholder="Ex.: 999998888"
                onChange={(e) => onChange({ ativNumTelefone: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO C: ENDEREÇO PARA CORRESPONDÊNCIA */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">C. Endereço para Correspondência</CardTitle>
                <CardDescription>
                  Endereço postal de contato do beneficiário (E58 a E66)
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleCopiarEndereco}
              className="h-9 px-4 rounded-xl border-border/60 hover:bg-primary/10 text-xs font-semibold gap-2"
            >
              <Copy className="h-3.5 w-3.5" />
              Copiar do endereço da atividade
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* E58 - Tipo de Logradouro */}
            <div>
              <Label htmlFor="corrTipoLogradouro" className="font-semibold text-xs tracking-wide">
                Tipo de Logradouro *
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="corrTipoLogradouro"
                  options={tiposLogradouro}
                  value={data.corrTipoLogradouro || ''}
                  onChange={(val) => onChange({ corrTipoLogradouro: val })}
                  placeholder="Selecione..."
                  className={!data.corrTipoLogradouro ? 'border-destructive/60' : ''}
                />
              </div>
            </div>

            {/* E59 - Endereço */}
            <div className="md:col-span-2">
              <Label htmlFor="corrEndereco" className="font-semibold text-xs tracking-wide">
                Endereço *
              </Label>
              <Input
                id="corrEndereco"
                value={data.corrEndereco || ''}
                maxLength={45}
                placeholder="Rua, Avenida, Praça"
                onChange={(e) => onChange({ corrEndereco: e.target.value })}
                className={cn(
                  'h-10 rounded-xl mt-1.5 bg-background/50',
                  !data.corrEndereco && 'border-destructive/60 focus-visible:ring-destructive'
                )}
              />
            </div>

            {/* E60 - Nº */}
            <div>
              <Label htmlFor="corrNumero" className="font-semibold text-xs tracking-wide">
                Nº * (ou S/N)
              </Label>
              <Input
                id="corrNumero"
                value={data.corrNumero || ''}
                placeholder="Ex.: 450 ou S/N"
                onChange={(e) => onChange({ corrNumero: e.target.value })}
                className={cn(
                  'h-10 rounded-xl mt-1.5 bg-background/50',
                  !data.corrNumero && 'border-destructive/60 focus-visible:ring-destructive'
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* E61 - Complemento */}
            <div>
              <Label htmlFor="corrComplemento" className="text-xs">
                Complemento
              </Label>
              <Input
                id="corrComplemento"
                value={data.corrComplemento || ''}
                placeholder="Apto, Casa"
                onChange={(e) => onChange({ corrComplemento: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* E62 - Bairro */}
            <div>
              <Label htmlFor="corrBairro" className="font-semibold text-xs tracking-wide">
                Bairro *
              </Label>
              <Input
                id="corrBairro"
                value={data.corrBairro || ''}
                placeholder="Bairro"
                onChange={(e) => onChange({ corrBairro: e.target.value })}
                className={cn(
                  'h-10 rounded-xl mt-1.5 bg-background/50',
                  !data.corrBairro && 'border-destructive/60 focus-visible:ring-destructive'
                )}
              />
            </div>

            {/* E63 - CEP */}
            <div>
              <Label htmlFor="corrCep" className="font-semibold text-xs tracking-wide">
                CEP *
              </Label>
              <Input
                id="corrCep"
                value={data.corrCep || ''}
                placeholder="00000-000"
                onChange={(e) => onChange({ corrCep: e.target.value })}
                className={cn(
                  'h-10 rounded-xl mt-1.5 bg-background/50',
                  !data.corrCep && 'border-destructive/60 focus-visible:ring-destructive'
                )}
              />
            </div>

            {/* E64 - Município */}
            <div>
              <Label htmlFor="corrMunicipio" className="font-semibold text-xs tracking-wide">
                Município *
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="corrMunicipio"
                  options={municipios}
                  value={data.corrMunicipio || ''}
                  onChange={(val) => onChange({ corrMunicipio: val })}
                  placeholder="Selecione..."
                  className={!data.corrMunicipio ? 'border-destructive/60' : ''}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* E65 - DDD Telefone */}
            <div>
              <Label htmlFor="corrDddTelefone" className="text-xs">
                DDD Telefone
              </Label>
              <Input
                id="corrDddTelefone"
                value={data.corrDddTelefone || ''}
                maxLength={4}
                placeholder="Ex.: 85"
                onChange={(e) => onChange({ corrDddTelefone: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* E66 - Nº Telefone */}
            <div>
              <Label htmlFor="corrNumTelefone" className="text-xs">
                Nº Telefone
              </Label>
              <Input
                id="corrNumTelefone"
                value={data.corrNumTelefone || ''}
                maxLength={9}
                placeholder="Ex.: 999998888"
                onChange={(e) => onChange({ corrNumTelefone: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO D: IMÓVEL DA ATIVIDADE */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">D. Imóvel da Atividade</CardTitle>
              <CardDescription>
                Identificação do imóvel onde o projeto será implantado (F71, F72, E73 a E77)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* F71 - Denominação */}
            <div>
              <Label htmlFor="imovelDenominacao" className="text-xs">
                Denominação do Imóvel
              </Label>
              <Input
                id="imovelDenominacao"
                value={data.imovelDenominacao || ''}
                placeholder="Ex.: Fazenda Boa Esperança"
                onChange={(e) => onChange({ imovelDenominacao: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* F72 - Área */}
            <div>
              <Label htmlFor="imovelArea" className="text-xs">
                Área (ha)
              </Label>
              <Input
                id="imovelArea"
                type="number"
                min="0"
                step="0.01"
                value={data.imovelArea ?? ''}
                placeholder="0,00"
                onChange={(e) => onChange({ imovelArea: parseFloat(e.target.value) || 0 })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* E73 - Tipo de Uso do Imóvel */}
            <div>
              <Label htmlFor="imovelTipoUso" className="font-semibold text-xs tracking-wide">
                Tipo de Uso do Imóvel *
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="imovelTipoUso"
                  options={tiposPosse}
                  value={data.imovelTipoUso || ''}
                  onChange={(val) => onChange({ imovelTipoUso: val })}
                  placeholder="Selecione..."
                  className={!data.imovelTipoUso ? 'border-destructive/60' : ''}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* E74 - Proprietário do Imóvel */}
            <div>
              <Label htmlFor="imovelProprietario" className="font-semibold text-xs tracking-wide">
                Proprietário do Imóvel *
              </Label>
              <Input
                id="imovelProprietario"
                value={data.imovelProprietario || ''}
                maxLength={55}
                placeholder="Nome do proprietário"
                onChange={(e) => onChange({ imovelProprietario: e.target.value })}
                className={cn(
                  'h-10 rounded-xl mt-1.5 bg-background/50',
                  !data.imovelProprietario && 'border-destructive/60 focus-visible:ring-destructive'
                )}
              />
            </div>

            {/* E75 - CPF/CNPJ do Proprietário */}
            <div>
              <Label htmlFor="imovelCpfCnpjProprietario" className="font-semibold text-xs tracking-wide">
                CPF / CNPJ do Proprietário *
              </Label>
              <Input
                id="imovelCpfCnpjProprietario"
                value={data.imovelCpfCnpjProprietario || ''}
                placeholder="CPF ou CNPJ do proprietário"
                onChange={(e) => onChange({ imovelCpfCnpjProprietario: e.target.value })}
                className={cn(
                  'h-10 rounded-xl mt-1.5 bg-background/50',
                  !data.imovelCpfCnpjProprietario && 'border-destructive/60 focus-visible:ring-destructive'
                )}
              />
            </div>
          </div>

          {/* E77 - Itinerário */}
          <div>
            <Label htmlFor="imovelItinerario" className="text-xs">
              Itinerário (Como chegar)
            </Label>
            <Input
              id="imovelItinerario"
              value={data.imovelItinerario || ''}
              placeholder="Descrição do acesso até a propriedade"
              onChange={(e) => onChange({ imovelItinerario: e.target.value })}
              className="h-10 rounded-xl mt-1.5 bg-background/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO E: CÔNJUGE / COMPANHEIRO(A) */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">E. Cônjuge / Companheiro(a)</CardTitle>
              <CardDescription>
                Informações cadastrais do cônjuge, se houver (E82 a E97)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* E82 - Nome */}
            <div className="md:col-span-2">
              <Label htmlFor="conjugeNome" className="text-xs">
                Nome do Cônjuge / Companheiro(a)
              </Label>
              <Input
                id="conjugeNome"
                value={data.conjugeNome || ''}
                maxLength={55}
                placeholder="Nome completo do cônjuge"
                onChange={(e) => onChange({ conjugeNome: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* E83 - CPF Cônjuge */}
            <div>
              <Label htmlFor="conjugeCpf" className="text-xs">
                C.P.F. do Cônjuge
              </Label>
              <Input
                id="conjugeCpf"
                value={data.conjugeCpf || ''}
                placeholder="000.000.000-00"
                onChange={(e) => onChange({ conjugeCpf: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* E84 - Data Nascimento */}
            <div>
              <Label htmlFor="conjugeDataNascimento" className="text-xs">
                Data de Nascimento
              </Label>
              <Input
                id="conjugeDataNascimento"
                type="date"
                value={data.conjugeDataNascimento || ''}
                onChange={(e) => onChange({ conjugeDataNascimento: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* E86 - Tipo de Documento */}
            <div>
              <Label htmlFor="conjugeTipoDocumento" className="text-xs">
                Tipo de Documento
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="conjugeTipoDocumento"
                  options={tiposDocumento}
                  value={data.conjugeTipoDocumento || ''}
                  onChange={(val) => onChange({ conjugeTipoDocumento: val })}
                  placeholder="Selecione..."
                />
              </div>
            </div>

            {/* E85 - Nº Documento */}
            <div>
              <Label htmlFor="conjugeNumDocumento" className="text-xs">
                Nº do Documento
              </Label>
              <Input
                id="conjugeNumDocumento"
                value={data.conjugeNumDocumento || ''}
                placeholder="Número do documento"
                onChange={(e) => onChange({ conjugeNumDocumento: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* E87 - Órgão Emissor */}
            <div>
              <Label htmlFor="conjugeOrgaoEmissor" className="text-xs">
                Órgão Emissor
              </Label>
              <Input
                id="conjugeOrgaoEmissor"
                value={data.conjugeOrgaoEmissor || ''}
                placeholder="Ex.: SSP"
                onChange={(e) => onChange({ conjugeOrgaoEmissor: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* E88 - UF Órgão Emissor */}
            <div>
              <Label htmlFor="conjugeUfOrgaoEmissor" className="text-xs">
                UF Órgão Emissor
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="conjugeUfOrgaoEmissor"
                  options={ufs}
                  value={data.conjugeUfOrgaoEmissor || ''}
                  onChange={(val) => onChange({ conjugeUfOrgaoEmissor: val })}
                  placeholder="Selecione..."
                />
              </div>
            </div>

            {/* E89 - Data de Emissão */}
            <div>
              <Label htmlFor="conjugeDataEmissao" className="text-xs">
                Data de Emissão
              </Label>
              <Input
                id="conjugeDataEmissao"
                type="date"
                value={data.conjugeDataEmissao || ''}
                onChange={(e) => onChange({ conjugeDataEmissao: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* E90 - Sexo */}
            <div>
              <Label htmlFor="conjugeSexo" className="text-xs">
                Sexo
              </Label>
              <Select
                value={data.conjugeSexo || ''}
                onValueChange={(val: 'Masculino' | 'Feminino') => onChange({ conjugeSexo: val })}
              >
                <SelectTrigger id="conjugeSexo" className="h-10 rounded-xl mt-1.5 bg-background/50">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* E91 - Estado Civil */}
            <div>
              <Label htmlFor="conjugeEstadoCivil" className="text-xs">
                Estado Civil
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="conjugeEstadoCivil"
                  options={estadosCivis}
                  value={data.conjugeEstadoCivil || ''}
                  onChange={(val) => onChange({ conjugeEstadoCivil: val })}
                  placeholder="Selecione..."
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* E92 - Grau de Instrução */}
            <div>
              <Label htmlFor="conjugeGrauInstrucao" className="text-xs">
                Grau de Instrução
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="conjugeGrauInstrucao"
                  options={escolaridades}
                  value={data.conjugeGrauInstrucao || ''}
                  onChange={(val) => onChange({ conjugeGrauInstrucao: val })}
                  placeholder="Selecione..."
                />
              </div>
            </div>

            {/* E93 - Profissão */}
            <div>
              <Label htmlFor="conjugeProfissao" className="text-xs">
                Profissão
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="conjugeProfissao"
                  options={profissoes}
                  value={data.conjugeProfissao || ''}
                  onChange={(val) => onChange({ conjugeProfissao: val })}
                  placeholder="Selecione..."
                />
              </div>
            </div>

            {/* E94 - Renda Mensal */}
            <div>
              <Label htmlFor="conjugeRendaMensal" className="text-xs">
                Renda Mensal (R$)
              </Label>
              <Input
                id="conjugeRendaMensal"
                type="number"
                min="0"
                step="0.01"
                value={data.conjugeRendaMensal ?? ''}
                placeholder="0,00"
                onChange={(e) => onChange({ conjugeRendaMensal: parseFloat(e.target.value) || 0 })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* E95 - Naturalidade */}
            <div>
              <Label htmlFor="conjugeNaturalidade" className="text-xs">
                Naturalidade
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  id="conjugeNaturalidade"
                  options={municipios}
                  value={data.conjugeNaturalidade || ''}
                  onChange={(val) => onChange({ conjugeNaturalidade: val })}
                  placeholder="Selecione..."
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* E96 - Nome do Pai */}
            <div>
              <Label htmlFor="conjugeNomePai" className="text-xs">
                Nome do Pai
              </Label>
              <Input
                id="conjugeNomePai"
                value={data.conjugeNomePai || ''}
                maxLength={55}
                placeholder="Nome do pai do cônjuge"
                onChange={(e) => onChange({ conjugeNomePai: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>

            {/* E97 - Nome da Mãe */}
            <div>
              <Label htmlFor="conjugeNomeMae" className="text-xs">
                Nome da Mãe
              </Label>
              <Input
                id="conjugeNomeMae"
                value={data.conjugeNomeMae || ''}
                maxLength={55}
                placeholder="Nome da mãe do cônjuge"
                onChange={(e) => onChange({ conjugeNomeMae: e.target.value })}
                className="h-10 rounded-xl mt-1.5 bg-background/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO F: SÓCIOS / PARTICIPAÇÕES */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">F. Sócios / Participações</CardTitle>
              <CardDescription>
                Informações dos sócios para pessoa jurídica ou copropriedade (E106 a E137 - até 5 sócios)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {[0, 1, 2, 3, 4].map((index) => {
            const socio = data.socios?.[index] || {
              cpfCnpj: '',
              nome: '',
              participacao: '',
              representaEmpresa: '',
            };
            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Sócio {index + 1}
                  </span>
                  <Separator className="flex-1 opacity-40" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* CPF / CNPJ */}
                  <div>
                    <Label htmlFor={`socio-${index}-cpf`} className="text-xs">
                      CPF / CNPJ
                    </Label>
                    <Input
                      id={`socio-${index}-cpf`}
                      value={socio.cpfCnpj || ''}
                      placeholder="CPF ou CNPJ"
                      onChange={(e) => handleSocioChange(index, 'cpfCnpj', e.target.value)}
                      className="h-10 rounded-xl mt-1.5 bg-background/50"
                    />
                  </div>

                  {/* Nome / Razão Social */}
                  <div className="md:col-span-2">
                    <Label htmlFor={`socio-${index}-nome`} className="text-xs">
                      Nome / Razão Social
                    </Label>
                    <Input
                      id={`socio-${index}-nome`}
                      value={socio.nome || ''}
                      placeholder="Nome completo ou Razão Social"
                      onChange={(e) => handleSocioChange(index, 'nome', e.target.value)}
                      className="h-10 rounded-xl mt-1.5 bg-background/50"
                    />
                  </div>

                  {/* Participação e Representa */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`socio-${index}-part`} className="text-xs">
                        Part. (%)
                      </Label>
                      <Input
                        id={`socio-${index}-part`}
                        value={socio.participacao || ''}
                        placeholder="%"
                        onChange={(e) => handleSocioChange(index, 'participacao', e.target.value)}
                        className="h-10 rounded-xl mt-1.5 bg-background/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`socio-${index}-rep`} className="text-xs">
                        Representa?
                      </Label>
                      <Select
                        value={socio.representaEmpresa || ''}
                        onValueChange={(val: 'Sim' | 'Não') =>
                          handleSocioChange(index, 'representaEmpresa', val)
                        }
                      >
                        <SelectTrigger
                          id={`socio-${index}-rep`}
                          className="h-10 rounded-xl mt-1.5 bg-background/50"
                        >
                          <SelectValue placeholder="S/N" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Sim">Sim</SelectItem>
                          <SelectItem value="Não">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default TabCliente;
