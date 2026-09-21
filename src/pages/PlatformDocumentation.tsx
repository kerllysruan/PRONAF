import { useState } from "react";
import {
  BookOpen,
  LayoutDashboard,
  Box,
  FileText,
  FolderCheck,
  Share2,
  UserCheck,
  Shield,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  Printer,
  Search,
  ExternalLink,
  Layers,
  Cpu,
  FileSpreadsheet,
  Smartphone,
  Lock,
  Workflow,
  HelpCircle,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PlatformDocumentation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState("visao-geral");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleDownloadStandaloneHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SuperGestão PRONAF – Manual e Documentação Oficial da Plataforma</title>
  <style>
    :root {
      --primary: #0f172a;
      --primary-accent: #2563eb;
      --emerald: #059669;
      --indigo: #4f46e5;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: var(--bg); color: var(--text); line-height: 1.6; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; padding: 40px 24px; border-bottom: 4px solid var(--emerald); }
    .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 28px; margin-bottom: 8px; font-weight: 800; }
    .subtitle { color: #94a3b8; font-size: 16px; margin-bottom: 16px; }
    .badge { display: inline-block; background: rgba(5,150,105,0.2); color: #34d399; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .section { background: var(--card-bg); border-radius: 16px; border: 1px solid var(--border); padding: 32px; margin-bottom: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    h2 { font-size: 22px; color: var(--primary); margin-bottom: 20px; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; }
    h3 { font-size: 17px; margin: 18px 0 10px 0; color: #1e293b; }
    p { margin-bottom: 14px; color: #334155; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 16px; }
    .card { background: #f8fafc; border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
    .card-title { font-weight: 700; font-size: 16px; color: var(--primary); margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .card-badge { font-size: 11px; padding: 2px 8px; border-radius: 6px; font-weight: 600; background: #e0e7ff; color: #3730a3; }
    .flow-step { display: flex; gap: 16px; margin-bottom: 20px; position: relative; }
    .step-number { width: 36px; height: 36px; border-radius: 50%; background: var(--primary-accent); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
    .step-content { flex: 1; background: #f8fafc; border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
    .tip-box { background: #ecfdf5; border-left: 4px solid var(--emerald); padding: 14px; border-radius: 0 8px 8px 0; margin-top: 10px; font-size: 13px; color: #065f46; }
    .footer { text-align: center; padding: 30px; color: var(--text-muted); font-size: 13px; border-top: 1px solid var(--border); }
    @media print { body { background: #fff; } .section { box-shadow: none; border: 1px solid #ccc; break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="container">
      <span class="badge">MANUAL OFICIAL & DOCUMENTAÇÃO TÉCNICA</span>
      <h1>SuperGestão – Documentação da Plataforma</h1>
      <p class="subtitle">Sistema Integrado de Gestão de Propostas, Estoque e Tramitação Documental PRONAF</p>
    </div>
  </div>
  <div class="container">
    <div class="section">
      <h2>1. Visão Geral da Plataforma</h2>
      <p>A plataforma <strong>SuperGestão (PRONAF)</strong> é uma solução corporativa de alta performance criada para gerenciar, unificar e acelerar a esteira operacional de crédito rural do Programa Nacional de Fortalecimento da Agricultura Familiar.</p>
      <p>O sistema atua como ponto único de contato entre produtores rurais, projetistas técnicos, analistas de crédito e gerentes de agência, garantindo conformidade com as normas bancárias e reduzindo o tempo de contratação de semanas para poucos dias.</p>
      <div class="grid">
        <div class="card">
          <div class="card-title">🎯 Objetivo Central</div>
          <p>Eliminar gargalos documentais, evitar retrabalho, centralizar propostas em estoque e gerar rastreabilidade completa até a efetivação na Central de Crédito.</p>
        </div>
        <div class="card">
          <div class="card-title">👥 Público-Alvo</div>
          <p>Gerentes de Agência, Analistas de Crédito Rural, Projetistas Credenciados e Produtores Rurais (através do Portal de Envio Seguro).</p>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>2. Especificações Técnicas e Módulos</h2>
      <div class="grid">
        <div class="card">
          <div class="card-title">📊 Dashboard Executivo <span class="card-badge">Módulo 1</span></div>
          <p><strong>Função:</strong> Consolidação de métricas, metas mensais, desembolsos e ticket médio.</p>
          <p><strong>Acesso:</strong> Todos os perfis com permissão can_view_dashboard.</p>
        </div>
        <div class="card">
          <div class="card-title">📦 Propostas em Estoque <span class="card-badge">Módulo 2</span></div>
          <p><strong>Função:</strong> Gestão de propostas prévias, importação em lote CSV, geração de relatórios PDF executivos e mensagens formatadas para WhatsApp.</p>
          <p><strong>Acesso:</strong> Analistas, Gerentes e Administradores.</p>
        </div>
        <div class="card">
          <div class="card-title">✅ Propostas Concluídas <span class="card-badge">Módulo 3</span></div>
          <p><strong>Função:</strong> Histórico e gestão de contratos deferidos e liquidados na centralizadora.</p>
          <p><strong>Acesso:</strong> Equipe interna de análise.</p>
        </div>
        <div class="card">
          <div class="card-title">📁 Tramitação de Documentos <span class="card-badge">Módulo 4</span></div>
          <p><strong>Função:</strong> Geração de tokens de acesso público para coleta de documentos do produtor sem login.</p>
          <p><strong>Acesso:</strong> Analistas de documentação.</p>
        </div>
        <div class="card">
          <div class="card-title">👷 Controle de Projetistas <span class="card-badge">Módulo 5</span></div>
          <p><strong>Função:</strong> Cadastro mestre de projetistas com CPF, CREA/CFTA e sincronização em cascata com propostas.</p>
          <p><strong>Acesso:</strong> Gestores operacionais.</p>
        </div>
        <div class="card">
          <div class="card-title">🏢 Gestão de Agências <span class="card-badge">Módulo 6</span></div>
          <p><strong>Função:</strong> Administração multiagências (Santa Inês, Gov. Nunes Freire, etc.) e isolamento de carteiras.</p>
          <p><strong>Acesso:</strong> Administrador Geral.</p>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>3. Fluxo de Tramitação Operacional</h2>
      <div class="flow-step">
        <div class="step-number">1</div>
        <div class="step-content">
          <h3>Entrada no Estoque & Triagem</h3>
          <p><strong>Responsável:</strong> Projetista ou Atendimento de Agência | <strong>Status:</strong> AGUARDANDO ENTREVISTA</p>
          <p>A proposta entra no sistema por cadastro individual ou carga de lote CSV com validação de agência obrigatória.</p>
        </div>
      </div>
      <div class="flow-step">
        <div class="step-number">2</div>
        <div class="step-content">
          <h3>Conferência Cadastral e Restritivos</h3>
          <p><strong>Responsável:</strong> Analista de Crédito | <strong>Status:</strong> EM ANÁLISE / RESTRIÇÃO</p>
          <p>Verificação de pendências impeditivas (SERASA, CADIN, regularidade fundiária e DAP/CAF).</p>
        </div>
      </div>
      <div class="flow-step">
        <div class="step-number">3</div>
        <div class="step-content">
          <h3>Coleta Documental Via Token Seguro</h3>
          <p><strong>Responsável:</strong> Produtor / Projetista | <strong>Status:</strong> DOCUMENTAÇÃO PENDENTE</p>
          <p>O sistema gera um link individual com expiração segura, enviado por WhatsApp para o produtor anexar documentos direto do celular.</p>
        </div>
      </div>
      <div class="flow-step">
        <div class="step-number">4</div>
        <div class="step-content">
          <h3>Considerações Gerenciais & Parecer</h3>
          <p><strong>Responsável:</strong> Gerente de Agência | <strong>Status:</strong> EMITIR CONSIDERAÇÕES GERENCIAIS</p>
          <p>Validação da capacidade de pagamento, linha de crédito e aprovação preliminar.</p>
        </div>
      </div>
      <div class="flow-step">
        <div class="step-number">5</div>
        <div class="step-content">
          <h3>Autorização e Envio à Centralizadora</h3>
          <p><strong>Responsável:</strong> Analista Sênior / Gerente | <strong>Status:</strong> AUTORIZADO ENVIO CENTRAL</p>
          <p>Dossiê completo transmitido eletronicamente para a esteira final de aprovação bancária.</p>
        </div>
      </div>
      <div class="flow-step">
        <div class="step-number">6</div>
        <div class="step-content">
          <h3>Deferimento e Contratação Final</h3>
          <p><strong>Responsável:</strong> Central de Crédito | <strong>Status:</strong> CONTRATADO / CONCLUÍDO</p>
          <p>Assinatura do contrato pelo produtor e liberação dos recursos financeiros.</p>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>4. Passo a Passo de Utilização (Manual do Usuário)</h2>
      <div class="flow-step">
        <div class="step-number">1</div>
        <div class="step-content">
          <h3>Como Fazer Login</h3>
          <p>Acesse o sistema pela tela de login, informe sua <strong>Matrícula Funcional (Ex: F180227)</strong> e sua senha cadastrada. Caso esteja vinculado a múltiplas agências, selecione a agência ativa no topo da tela.</p>
          <div class="tip-box">💡 Dica: Usuários administradores podem navegar livremente entre todas as agências através do seletor superior.</div>
        </div>
      </div>
      <div class="flow-step">
        <div class="step-number">2</div>
        <div class="step-content">
          <h3>Como Cadastrar ou Importar Propostas</h3>
          <p>Acesse o menu <strong>Estoque</strong>. Você pode clicar em <strong>+ Nova Proposta</strong> para cadastro individual preenchendo Nome, CPF, Município e Projetista, ou em <strong>Importar CSV</strong> para carregar centenas de propostas simultaneamente.</p>
        </div>
      </div>
      <div class="flow-step">
        <div class="step-number">3</div>
        <div class="step-content">
          <h3>Como Gerar Link de Documentação</h3>
          <p>No módulo <strong>Documentação</strong>, localize o produtor e clique em <strong>Gerar Token Seguro</strong>. O sistema gera automaticamente um link e uma mensagem pronta para WhatsApp com as instruções e prazo.</p>
        </div>
      </div>
      <div class="flow-step">
        <div class="step-number">4</div>
        <div class="step-content">
          <h3>Como Emitir o Relatório Executivo em PDF</h3>
          <p>No módulo <strong>Estoque</strong>, clique no botão <strong>Relatório</strong> no topo direito. O modal exibirá um resumo do volume a ser exportado e opções de formato (Dashboard Executivo, Listagem Analítica ou Completo). Clique em <strong>Gerar PDF Executivo</strong>.</p>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>5. Considerações Finais</h2>
      <p>A plataforma <strong>SuperGestão (PRONAF)</strong> representa um salto significativo em governança, segurança da informação e velocidade operacional para as agências de crédito rural. Ao digitalizar toda a cadeia de valor do crédito, reduz-se o extravio de documentos físicos, aumenta-se a produtividade dos projetistas credenciados e potencializa-se o atendimento aos agricultores familiares.</p>
    </div>
  </div>
  <div class="footer">
    <p>SuperGestão PRONAF • Sistema Integrado de Gestão • Documento Oficial</p>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "SuperGestao_PRONAF_Documentacao_Oficial.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const modules = [
    {
      id: "dashboard",
      title: "Dashboard Executivo",
      route: "/",
      icon: LayoutDashboard,
      badge: "Módulo Estratégico",
      color: "from-blue-500 to-indigo-600",
      description: "Visão consolidada dos principais indicadores de crédito, metas e performance.",
      permission: "Visualização ampla (can_view_dashboard)",
      features: [
        "Cards de montante total em análise, contratado e desembolsado",
        "Evolução temporal e projeção mensal de metas",
        "Distribuição percentual por agência e polo de atendimento",
        "Gráficos analíticos de ticket médio e conversão",
      ],
    },
    {
      id: "estoque",
      title: "Propostas em Estoque",
      route: "/estoque",
      icon: Box,
      badge: "Núcleo Operacional",
      color: "from-indigo-500 to-purple-600",
      description: "Esteira de propostas prontas para validação, triagem e envio à central.",
      permission: "Analistas, Gerentes e Administradores (can_view_proposals)",
      features: [
        "Importação em lote de planilhas CSV com detecção inteligente de colunas",
        "Cadastro rápido de propostas individuais com validação obrigatória de agência",
        "Relatório Executivo Premium em PDF sem sobreposição com dashboard embutido",
        "Disparo de mensagens WhatsApp com CPF e CREA/CFTA do projetista formatados",
        "Filtros multidimensionais por agência, status, projetista e município",
        "Exclusão em massa segura e controle de status em tempo real",
      ],
    },
    {
      id: "concluidas",
      title: "Propostas Concluídas",
      route: "/propostas",
      icon: FileText,
      badge: "Finalização",
      color: "from-emerald-500 to-teal-600",
      description: "Histórico consolidado de contratos deferidos e liquidados na centralizadora.",
      permission: "Equipe de análise e gerência (can_view_proposals)",
      features: [
        "Controle de liquidação e desembolso efetivo dos recursos",
        "Auditoria de tempo de tramitação desde o cadastro até a contratação",
        "Exportação de dados para conciliação contábil",
      ],
    },
    {
      id: "documentacao",
      title: "Documentação & Links Seguros",
      route: "/documentacao",
      icon: FolderCheck,
      badge: "Automação Digital",
      color: "from-cyan-500 to-blue-600",
      description: "Coleta externa de arquivos e certidões dos produtores rurais sem login.",
      permission: "Equipe documental (can_view_documentation)",
      features: [
        "Geração de tokens únicos de acesso seguro com prazo de validade configurável",
        "Portal externo mobile-first para o produtor anexar fotos de documentos e DAP/CAF",
        "Checklist automatizado de pendências com validação de status",
        "Pré-visualização e download de certidões em alta resolução",
      ],
    },
    {
      id: "projetistas",
      title: "Controle de Projetistas",
      route: "/projetistas",
      icon: UserCheck,
      badge: "Gestão de Credenciados",
      color: "from-amber-500 to-orange-600",
      description: "Cadastro mestre de profissionais técnicos e sincronização em tempo real.",
      permission: "Operações e Administração (can_view_proposals)",
      features: [
        "Cadastro de projetistas com Nome, CPF, CREA/CFTA, e-mail e telefone",
        "Edição com propagação em cascata no banco de dados para propostas associadas",
        "Contador dinâmico de propostas sob responsabilidade de cada profissional",
        "Exclusão segura e desvinculação limpa de histórico",
      ],
    },
    {
      id: "arquivos",
      title: "Troca de Arquivos",
      route: "/troca-arquivos",
      icon: Share2,
      badge: "Repositório Seguro",
      color: "from-violet-500 to-purple-600",
      description: "Canal seguro para transferência de projetos técnicos e laudos volumosos.",
      permission: "Projetistas e Analistas (can_view_proposals)",
      features: [
        "Upload de arquivos técnicos (PDF, DWG, planilhas e fotos de vistoria)",
        "Controle de versão e compartilhamento protegido por agência",
      ],
    },
    {
      id: "acesso",
      title: "Controle de Acesso & Perfis",
      route: "/controle-acesso",
      icon: Shield,
      badge: "Segurança & Governança",
      color: "from-rose-500 to-red-600",
      description: "Gestão granular de permissões, perfis e autenticação por matrícula.",
      permission: "Exclusivo Administrador Geral (can_view_access_control)",
      features: [
        "Autenticação corporativa por Matrícula Funcional (Ex: F180227)",
        "Matriz de permissões por tela (Dashboard, Estoque, Documentação, etc.)",
        "Perfis de Desenvolvedor, Administrador, Analista e Visitante",
        "Reset seguro de senhas com criptografia nativa pgcrypto",
      ],
    },
    {
      id: "agencias",
      title: "Gestão de Agências",
      route: "/admin/agencies",
      icon: Building2,
      badge: "Multagência",
      color: "from-slate-700 to-slate-900",
      description: "Administração dos polos bancários e isolamento seguro de carteiras.",
      permission: "Exclusivo Administrador Geral (can_manage_agencies)",
      features: [
        "Cadastro de agências com código de compensação bancária e localização",
        "Seletor global de agência no topo da aplicação para navegação instantânea",
        "Vinculação estrita de usuários às suas respectivas agências de atuação",
      ],
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Acesso & Autenticação",
      resp: "Todos os Usuários",
      status: "Login Inicial",
      desc: "O usuário acessa o sistema informando sua Matrícula Funcional (ex: F180227) e senha cadastrada. Caso possua acesso a múltiplos polos, escolhe a Agência Ativa no cabeçalho superior.",
      tip: "Usuários com perfil de Administrador conseguem alternar entre Santa Inês, Governador Nunes Freire ou visualizar 'Todas as Agências'.",
    },
    {
      num: "02",
      title: "Entrada da Proposta no Estoque",
      resp: "Projetista Técnico ou Agência",
      status: "AGUARDANDO ENTREVISTA",
      desc: "A proposta é cadastrada individualmente ou inserida via importação em lote CSV com detecção automática de linhas de crédito, município e projetista responsável.",
      tip: "O sistema valida rigorosamente que nenhuma proposta seja cadastrada sem uma agência bancária vinculada.",
    },
    {
      num: "03",
      title: "Análise Cadastral & Restrições",
      resp: "Analista de Crédito Rural",
      status: "EM ANÁLISE / RESTRIÇÃO",
      desc: "Avaliação do enquadramento no PRONAF, conferência do CPF junto ao SERASA/CADIN e validação da titularidade da propriedade rural.",
      tip: "Propostas com restrição são sinalizadas com badge vermelho no estoque e monitoradas no indicador de regularidade.",
    },
    {
      num: "04",
      title: "Coleta Documental Via Link Seguro",
      resp: "Produtor Rural / Analista",
      status: "DOCUMENTAÇÃO PENDENTE",
      desc: "O analista gera um token de acesso seguro no módulo de Documentação. O sistema formata a mensagem WhatsApp para o produtor rural carregar certidões, DAP/CAF e CAR direto do celular.",
      tip: "O produtor não precisa criar login ou senha; o link temporário valida os anexos com total segurança.",
    },
    {
      num: "05",
      title: "Considerações Gerenciais & Parecer",
      resp: "Gerente de Agência",
      status: "EMITIR CONSIDERAÇÕES GERENCIAIS",
      desc: "Elaboração do parecer gerencial, validação do cronograma de desembolso e confirmação das credenciais técnicas do projetista (CREA/CFTA).",
      tip: "Utilize o botão de cópia de texto gerencial para colar os dados estruturados no sistema bancário interno.",
    },
    {
      num: "06",
      title: "Autorização & Envio à Centralizadora",
      resp: "Gerência / Mesa de Crédito",
      status: "AUTORIZADO ENVIO CENTRAL",
      desc: "A proposta recebe autorização formal e o status muda para 'AUTORIZADO ENVIO CENTRAL' ou 'ENVIADO PARA CENTRAL', registrando a data e o analista responsável.",
      tip: "Nesta etapa, o relatório executivo em PDF pode ser emitido como resumo de lote para encaminhamento.",
    },
    {
      num: "07",
      title: "Deferimento & Contratação Final",
      resp: "Central de Crédito",
      status: "APROVADA / CONTRATADO",
      desc: "Emissão da Cédula de Crédito Bancário, assinatura formal e migração do registro para o módulo de Propostas Concluídas com liquidação do valor.",
      tip: "A proposta alimenta os gráficos de desembolso e performance do Dashboard Executivo.",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto w-full pb-24 animate-in fade-in duration-500">
      {/* ── HEADER CORPORATIVO ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-10 rounded-3xl border border-slate-700/50 shadow-2xl text-white">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs px-3 py-1 font-bold">
                DOCUMENTAÇÃO OFICIAL & GUIA OPERACIONAL
              </Badge>
              <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                Versão 2.4 Enterprise
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-heading tracking-tight text-white">
              SuperGestão – Documentação da Plataforma
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-3xl leading-relaxed">
              Manual técnico completo, especificação de módulos, fluxo operacional ponta a ponta e guia passo a passo de utilização do ecossistema de crédito rural PRONAF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleDownloadStandaloneHTML}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-900/40"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar Guia HTML Autocontido
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="border-slate-600 bg-slate-800/80 text-white hover:bg-slate-700 font-semibold"
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Barra de Navegação Rápida com Âncoras */}
        <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-slate-700/60">
          {[
            { id: "visao-geral", label: "1. Visão Geral" },
            { id: "modulos", label: "2. Módulos do Sistema" },
            { id: "fluxo", label: "3. Fluxo de Tramitação" },
            { id: "manual", label: "4. Passo a Passo de Uso" },
            { id: "consideracoes", label: "5. Benefícios e Conclusão" },
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollTo(sec.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSection === sec.id
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-900/30"
                  : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-white"
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SEÇÃO 1: VISÃO GERAL ── */}
      <section id="visao-geral" className="scroll-mt-6">
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-foreground">Visão Geral da Plataforma</CardTitle>
                <CardDescription className="text-xs">Propósito estratégico e arquitetura de negócios</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              O <strong className="text-foreground">SuperGestão (PRONAF)</strong> é uma plataforma integrada de gestão estratégica concebida para otimizar o ciclo de vida do crédito rural para a agricultura familiar. Ela elimina o trâmite de papéis dispersos e centraliza dados de produtores, projetos técnicos elaborados por credenciados, conferência de documentação comprobatória e transmissão em tempo hábil para a centralizadora de crédito bancário.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <Workflow className="h-4 w-4 text-indigo-600" />
                  Rastreabilidade Total
                </div>
                <p className="text-xs text-indigo-950/80 leading-relaxed">
                  Cada proposta possui histórico auditável, carimbo de data/hora, projetista responsável e estágio exato na esteira de aprovação.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <Smartphone className="h-4 w-4 text-emerald-600" />
                  Envio Seguro Sem Senha
                </div>
                <p className="text-xs text-emerald-950/80 leading-relaxed">
                  O produtor rural carrega suas certidões e comprovantes diretamente do celular através de link temporário e token seguro.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Shield className="h-4 w-4 text-amber-600" />
                  Segurança & Isolamento
                </div>
                <p className="text-xs text-amber-950/80 leading-relaxed">
                  Governança multiagências estrita com proteção em nível de banco de dados (Row Level Security no PostgreSQL/Supabase).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── SEÇÃO 2: ESPECIFICAÇÕES TÉCNICAS E MÓDULOS ── */}
      <section id="modulos" className="scroll-mt-6">
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-foreground">Especificações Técnicas dos Módulos</CardTitle>
                  <CardDescription className="text-xs">Estrutura completa das 8 telas e funcionalidades detalhadas</CardDescription>
                </div>
              </div>
              <div className="w-full sm:w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar módulos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {modules
                .filter(
                  (m) =>
                    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    m.description.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <div
                      key={mod.id}
                      className="flex flex-col justify-between p-5 rounded-2xl bg-card border border-border/70 hover:border-indigo-300 hover:shadow-md transition-all group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center text-white shadow-sm`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-base text-foreground group-hover:text-indigo-600 transition-colors">
                                {mod.title}
                              </h3>
                              <p className="text-[11px] font-mono text-muted-foreground">Rota: {mod.route}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-[10px] font-bold">
                            {mod.badge}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">{mod.description}</p>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700">
                          <strong className="text-slate-900">Permissão:</strong> {mod.permission}
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                            Principais Recursos:
                          </p>
                          <ul className="space-y-1">
                            {mod.features.map((feat, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── SEÇÃO 3: FLUXO DE TRAMITAÇÃO (DIAGRAMA VISUAL SVG/CSS) ── */}
      <section id="fluxo" className="scroll-mt-6">
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-foreground">Fluxo de Tramitação Operacional</CardTitle>
                <CardDescription className="text-xs">Ciclo de vida de uma proposta desde a entrada até a contratação</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-8">
            {/* Diagrama Visual de Fluxo */}
            <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-inner overflow-x-auto">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                DIAGRAMA DE TRANSIÇÃO DE ESTADOS (ESTEIRA PRONAF)
              </p>

              <div className="flex items-center justify-between min-w-[900px] gap-3">
                {[
                  { title: "1. Estoque", sub: "Aguardando Entrevista", color: "bg-blue-600" },
                  { title: "2. Triagem", sub: "Conferência Serasa/CAF", color: "bg-indigo-600" },
                  { title: "3. Documentação", sub: "Upload Token Seguro", color: "bg-purple-600" },
                  { title: "4. Parecer", sub: "Considerações Gerenciais", color: "bg-amber-600" },
                  { title: "5. Central", sub: "Autorizado Envio Central", color: "bg-emerald-600" },
                  { title: "6. Concluído", sub: "Contratado / Desembolso", color: "bg-teal-500" },
                ].map((node, i) => (
                  <div key={i} className="flex items-center gap-3 flex-1">
                    <div className={`flex flex-col p-4 rounded-2xl ${node.color} text-white shadow-lg flex-1 min-w-[130px]`}>
                      <span className="text-[10px] font-bold text-white/80 uppercase">{node.title}</span>
                      <strong className="text-xs font-bold mt-1 text-white leading-tight">{node.sub}</strong>
                    </div>
                    {i < 5 && <ArrowRight className="h-4 w-4 text-slate-500 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Tabela / Lista Detalhada das Etapas */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground">Detalhamento Regimental das Etapas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {steps.map((st) => (
                  <div key={st.num} className="p-5 rounded-2xl bg-card border border-border/70 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          {st.num}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {st.status}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-sm text-foreground">{st.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{st.desc}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <p className="text-[11px] text-slate-600">
                        <strong>Responsável:</strong> {st.resp}
                      </p>
                      <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-900 leading-tight">
                        <strong>Dica Operacional:</strong> {st.tip}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── SEÇÃO 4: PASSO A PASSO DE UTILIZAÇÃO (MANUAL DO USUÁRIO) ── */}
      <section id="manual" className="scroll-mt-6">
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-foreground">Passo a Passo de Utilização (Manual Prático)</CardTitle>
                <CardDescription className="text-xs">Guia sequencial para operação diária do sistema</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-2">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Passo 1</span>
                <h4 className="font-bold text-sm text-foreground">Como fazer Login no Sistema</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Na tela inicial de login (<code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded">/auth</code>), digite sua <strong>Matrícula Funcional</strong> (ex: F180227) e a senha pessoal. Clique em <strong>Entrar</strong>. O sistema autenticará suas credenciais de forma segura.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-2">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Passo 2</span>
                <h4 className="font-bold text-sm text-foreground">Como Selecionar e Alternar Agências</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No canto superior da tela, ao lado do logo PRONAF, utilize o seletor com ícone de agência bancária para escolher o polo operacional de trabalho (ex: <em>Santa Inês</em> ou <em>Governador Nunes Freire</em>). Todos os números e gráficos se adaptarão automaticamente.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-2">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Passo 3</span>
                <h4 className="font-bold text-sm text-foreground">Como Cadastrar ou Importar Propostas</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No menu <strong>Estoque</strong>, clique em <strong>+ Nova Proposta</strong> para entrada avulsa ou em <strong>Importar CSV</strong> para carregar planilhas de lote. O sistema faz a validação e vincula as propostas diretamente à agência ativa selecionada.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-2">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Passo 4</span>
                <h4 className="font-bold text-sm text-foreground">Como Gerar Link Seguro de Documentação</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Acesse o menu <strong>Documentação</strong>, localize a proposta desejada e clique em <strong>Gerar Token</strong>. Em seguida, utilize o botão de WhatsApp para enviar a mensagem automática ao produtor, contendo o link exclusivo de upload de certidões e comprovantes.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-2">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Passo 5</span>
                <h4 className="font-bold text-sm text-foreground">Como Emitir o Relatório Executivo em PDF</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No topo da tela de <strong>Estoque</strong>, clique no botão <strong>Relatório</strong>. Selecione o modelo (Completo, Apenas Dashboard ou Listagem Analítica), filtre os dados desejados e clique em <strong>Gerar PDF Executivo</strong> para download imediato.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-2">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Passo 6</span>
                <h4 className="font-bold text-sm text-foreground">Como Cadastrar e Gerenciar Projetistas</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No menu <strong>Projetistas</strong>, visualize a tabela com número de propostas vinculadas a cada profissional. Clique em <strong>+ Novo Projetista</strong> ou no botão de editar para atualizar CPF e CREA/CFTA; todas as propostas atreladas serão atualizadas em tempo real.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── SEÇÃO 5: CONSIDERAÇÕES FINAIS ── */}
      <section id="consideracoes" className="scroll-mt-6">
        <Card className="border-border/60 shadow-sm overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 text-white">
          <CardContent className="p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-emerald-400" />
              <div>
                <h3 className="text-2xl font-bold font-heading text-white">Considerações Finais & Benefícios Estratégicos</h3>
                <p className="text-xs text-slate-300">Impacto da transformação digital na captação do crédito PRONAF</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
              A implantação do <strong className="text-white">SuperGestão PRONAF</strong> consolida um novo patamar de excelência para a gestão de crédito rural. Ao combinar rigor de conformidade bancária com interfaces modernas e fluxos ágeis via mobile, a instituição financeira garante segurança documental integral, auditoria contínua e um relacionamento ágil com o homem do campo e projetistas técnicos.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Button
                onClick={handleDownloadStandaloneHTML}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar Esta Documentação Oficial (HTML)
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
