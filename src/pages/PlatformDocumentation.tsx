import { useState, useEffect, useRef } from "react";
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
  ChevronDown,
  ChevronRight,
  Zap,
  Target,
  Users,
  TrendingUp,
  Globe,
  Menu,
  X,
  ArrowUp,
  Hash,
  BarChart3,
  CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/* ═══════════════════════════════════════════════════════════════════
   SuperGestão PRONAF — Documentação da Plataforma
   Design: Product Manager Premium Skin (Notion/Linear/Stripe-inspired)
   ═══════════════════════════════════════════════════════════════════ */

// ─── Animated Counter Hook ────────────────────────────────────────
function useAnimatedNumber(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
}

// ─── TOC Navigation Item ──────────────────────────────────────────
function TocItem({
  id,
  label,
  num,
  active,
  onClick,
}: {
  id: string;
  label: string;
  num: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 w-full text-left py-2.5 px-3 rounded-xl text-sm transition-all duration-200 cursor-pointer ${
        active
          ? "bg-slate-900 text-white font-semibold shadow-lg shadow-slate-900/20"
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium"
      }`}
    >
      <span
        className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold transition-all ${
          active
            ? "bg-emerald-400 text-slate-900"
            : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600"
        }`}
      >
        {num}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

// ─── Expandable Section ───────────────────────────────────────────
function Expandable({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all hover:border-slate-300">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-5 py-4 text-left bg-white hover:bg-slate-50/80 transition-colors cursor-pointer"
      >
        <span className="font-semibold text-sm text-slate-800">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-5 pt-1">{children}</div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function PlatformDocumentation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState("visao-geral");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const sectionIds = [
      "visao-geral",
      "metricas",
      "modulos",
      "fluxo",
      "manual",
      "consideracoes",
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.2, rootMargin: "-80px 0px -60% 0px" }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // ─── Standalone HTML Download ─────────────────────────────────
  const handleDownloadStandaloneHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SuperGestão PRONAF – Documentação Oficial da Plataforma</title>
  <style>
    :root {
      --primary: #0f172a;
      --accent: #10b981;
      --bg: #fafbfc;
      --card: #ffffff;
      --border: #e5e7eb;
      --text: #111827;
      --muted: #6b7280;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); line-height: 1.7; }
    .hero { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%); color: #fff; padding: 64px 32px; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; right: -100px; top: -100px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%); }
    .hero::after { content: ''; position: absolute; left: -50px; bottom: -80px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%); }
    .container { max-width: 960px; margin: 0 auto; position: relative; z-index: 1; }
    .badge { display: inline-block; background: rgba(16,185,129,0.2); color: #34d399; padding: 4px 14px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
    h1 { font-size: 36px; font-weight: 800; margin: 16px 0 12px; letter-spacing: -0.5px; }
    .hero p { color: #94a3b8; font-size: 16px; max-width: 600px; }
    .section { background: var(--card); border-radius: 16px; border: 1px solid var(--border); padding: 40px; margin: 24px auto; max-width: 960px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    h2 { font-size: 24px; font-weight: 800; color: var(--primary); margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f3f4f6; letter-spacing: -0.3px; }
    h3 { font-size: 18px; font-weight: 700; margin: 24px 0 12px; color: #1f2937; }
    p { margin-bottom: 16px; color: #374151; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 32px auto; max-width: 960px; }
    .metric { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 28px 24px; text-align: center; }
    .metric-value { font-size: 40px; font-weight: 800; background: linear-gradient(135deg, #0f172a, #4f46e5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .metric-label { font-size: 13px; color: var(--muted); margin-top: 6px; font-weight: 500; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 20px; }
    .card { background: #f9fafb; border: 1px solid var(--border); border-radius: 14px; padding: 24px; }
    .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
    .card-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .card-title { font-weight: 700; font-size: 16px; color: var(--primary); }
    .card-badge { font-size: 10px; padding: 2px 8px; border-radius: 6px; font-weight: 700; background: #eef2ff; color: #4338ca; text-transform: uppercase; letter-spacing: 0.3px; }
    .feature-list { list-style: none; padding: 0; }
    .feature-list li { padding: 6px 0; font-size: 13px; color: #4b5563; display: flex; align-items: flex-start; gap: 8px; }
    .feature-list li::before { content: '✓'; color: var(--accent); font-weight: 700; flex-shrink: 0; }
    .step { display: flex; gap: 20px; margin-bottom: 28px; }
    .step-num { width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; flex-shrink: 0; }
    .step-body { flex: 1; background: #f9fafb; border: 1px solid var(--border); border-radius: 14px; padding: 20px; }
    .step-body h4 { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
    .step-body p { font-size: 13px; margin-bottom: 8px; }
    .tip { background: #ecfdf5; border-left: 3px solid var(--accent); padding: 12px 16px; border-radius: 0 10px 10px 0; font-size: 12px; color: #065f46; margin-top: 8px; }
    .flow { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; padding: 32px; background: var(--primary); border-radius: 16px; margin-bottom: 32px; }
    .flow-node { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 14px 18px; border-radius: 12px; text-align: center; min-width: 120px; }
    .flow-node strong { display: block; font-size: 12px; opacity: 0.7; }
    .flow-node span { display: block; font-size: 13px; font-weight: 700; margin-top: 4px; }
    .flow-arrow { color: rgba(255,255,255,0.3); font-size: 20px; }
    .footer { text-align: center; padding: 40px 24px; color: var(--muted); font-size: 12px; border-top: 1px solid var(--border); margin-top: 20px; }
    .cta { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%); color: #fff; border-radius: 16px; padding: 48px; text-align: center; margin: 24px auto; max-width: 960px; }
    .cta h3 { color: #fff; margin-bottom: 12px; }
    .cta p { color: #94a3b8; max-width: 560px; margin: 0 auto 20px; }
    @media (max-width: 640px) { .hero { padding: 40px 20px; } h1 { font-size: 26px; } .section { padding: 24px; margin: 16px; } .metrics { margin: 16px; } .flow { flex-direction: column; } .flow-arrow { transform: rotate(90deg); } }
    @media print { body { background: #fff; } .section { box-shadow: none; break-inside: avoid; } .hero { padding: 32px; } }
  </style>
</head>
<body>
  <div class="hero">
    <div class="container">
      <span class="badge">DOCUMENTAÇÃO OFICIAL</span>
      <h1>SuperGestão PRONAF</h1>
      <p>Manual completo, especificação de módulos, fluxo operacional e guia de utilização do sistema integrado de gestão de crédito rural.</p>
    </div>
  </div>

  <div class="metrics">
    <div class="metric"><div class="metric-value">8</div><div class="metric-label">Módulos Integrados</div></div>
    <div class="metric"><div class="metric-value">7</div><div class="metric-label">Etapas de Tramitação</div></div>
    <div class="metric"><div class="metric-value">6</div><div class="metric-label">Perfis de Acesso</div></div>
    <div class="metric"><div class="metric-value">24/7</div><div class="metric-label">Disponibilidade Cloud</div></div>
  </div>

  <div class="section">
    <h2>1. Visão Geral</h2>
    <p>O <strong>SuperGestão (PRONAF)</strong> é uma plataforma corporativa de alta performance criada para gerenciar, unificar e acelerar a esteira operacional de crédito rural do Programa Nacional de Fortalecimento da Agricultura Familiar.</p>
    <p>O sistema atua como ponto único de contato entre produtores rurais, projetistas técnicos, analistas de crédito e gerentes de agência, garantindo conformidade com as normas bancárias e reduzindo o tempo de contratação.</p>
    <div class="grid">
      <div class="card"><div class="card-header"><div class="card-title">🎯 Objetivo Central</div></div><p style="font-size:13px">Eliminar gargalos documentais, evitar retrabalho, centralizar propostas e gerar rastreabilidade completa até a efetivação na Central de Crédito.</p></div>
      <div class="card"><div class="card-header"><div class="card-title">👥 Público-Alvo</div></div><p style="font-size:13px">Gerentes de Agência, Analistas de Crédito Rural, Projetistas Credenciados e Produtores Rurais (via Portal de Envio Seguro).</p></div>
    </div>
  </div>

  <div class="section">
    <h2>2. Módulos do Sistema</h2>
    <div class="grid">
      <div class="card"><div class="card-header"><div class="card-icon" style="background:#eef2ff;color:#4338ca">📊</div><div><div class="card-title">Dashboard Executivo</div><span class="card-badge">Estratégico</span></div></div><p style="font-size:13px"><strong>Função:</strong> Consolidação de métricas, metas mensais, desembolsos e ticket médio.</p><p style="font-size:12px;color:#6b7280"><strong>Acesso:</strong> Todos os perfis com permissão can_view_dashboard.</p></div>
      <div class="card"><div class="card-header"><div class="card-icon" style="background:#eef2ff;color:#7c3aed">📦</div><div><div class="card-title">Propostas em Estoque</div><span class="card-badge">Operacional</span></div></div><p style="font-size:13px"><strong>Função:</strong> Gestão de propostas, importação CSV, relatórios PDF executivos e mensagens WhatsApp.</p><p style="font-size:12px;color:#6b7280"><strong>Acesso:</strong> Analistas, Gerentes e Administradores.</p></div>
      <div class="card"><div class="card-header"><div class="card-icon" style="background:#ecfdf5;color:#059669">✅</div><div><div class="card-title">Propostas Concluídas</div><span class="card-badge">Finalização</span></div></div><p style="font-size:13px"><strong>Função:</strong> Histórico de contratos deferidos e liquidados na centralizadora.</p><p style="font-size:12px;color:#6b7280"><strong>Acesso:</strong> Equipe interna de análise.</p></div>
      <div class="card"><div class="card-header"><div class="card-icon" style="background:#ecfeff;color:#0891b2">📁</div><div><div class="card-title">Documentação & Links Seguros</div><span class="card-badge">Automação</span></div></div><p style="font-size:13px"><strong>Função:</strong> Tokens de acesso público para coleta de documentos sem login.</p><p style="font-size:12px;color:#6b7280"><strong>Acesso:</strong> Analistas de documentação.</p></div>
      <div class="card"><div class="card-header"><div class="card-icon" style="background:#fff7ed;color:#ea580c">👷</div><div><div class="card-title">Controle de Projetistas</div><span class="card-badge">Credenciados</span></div></div><p style="font-size:13px"><strong>Função:</strong> Cadastro mestre com CPF, CREA/CFTA e sincronização com propostas.</p><p style="font-size:12px;color:#6b7280"><strong>Acesso:</strong> Gestores operacionais.</p></div>
      <div class="card"><div class="card-header"><div class="card-icon" style="background:#fdf2f8;color:#db2777">🔗</div><div><div class="card-title">Troca de Arquivos</div><span class="card-badge">Repositório</span></div></div><p style="font-size:13px"><strong>Função:</strong> Canal seguro para transferência de projetos técnicos e laudos.</p><p style="font-size:12px;color:#6b7280"><strong>Acesso:</strong> Projetistas e Analistas.</p></div>
      <div class="card"><div class="card-header"><div class="card-icon" style="background:#fef2f2;color:#dc2626">🔒</div><div><div class="card-title">Controle de Acesso</div><span class="card-badge">Segurança</span></div></div><p style="font-size:13px"><strong>Função:</strong> Gestão de permissões, perfis e autenticação por matrícula.</p><p style="font-size:12px;color:#6b7280"><strong>Acesso:</strong> Exclusivo Administrador Geral.</p></div>
      <div class="card"><div class="card-header"><div class="card-icon" style="background:#f5f3ff;color:#7c3aed">🏢</div><div><div class="card-title">Gestão de Agências</div><span class="card-badge">Multiagência</span></div></div><p style="font-size:13px"><strong>Função:</strong> Administração multiagências e isolamento de carteiras.</p><p style="font-size:12px;color:#6b7280"><strong>Acesso:</strong> Exclusivo Administrador Geral.</p></div>
    </div>
  </div>

  <div class="section">
    <h2>3. Fluxo de Tramitação</h2>
    <div class="flow">
      <div class="flow-node"><strong>ETAPA 1</strong><span>Estoque</span></div><span class="flow-arrow">→</span>
      <div class="flow-node"><strong>ETAPA 2</strong><span>Triagem</span></div><span class="flow-arrow">→</span>
      <div class="flow-node"><strong>ETAPA 3</strong><span>Documentação</span></div><span class="flow-arrow">→</span>
      <div class="flow-node"><strong>ETAPA 4</strong><span>Parecer</span></div><span class="flow-arrow">→</span>
      <div class="flow-node"><strong>ETAPA 5</strong><span>Central</span></div><span class="flow-arrow">→</span>
      <div class="flow-node" style="border-color:#10b981"><strong>ETAPA 6</strong><span>Concluído</span></div>
    </div>
    <div class="step"><div class="step-num">1</div><div class="step-body"><h4>Entrada no Estoque & Triagem</h4><p>A proposta entra no sistema por cadastro individual ou carga de lote CSV com validação de agência obrigatória.</p><div class="tip">💡 Status: AGUARDANDO ENTREVISTA</div></div></div>
    <div class="step"><div class="step-num">2</div><div class="step-body"><h4>Conferência Cadastral e Restritivos</h4><p>Verificação de pendências (SERASA, CADIN, regularidade fundiária e DAP/CAF).</p><div class="tip">💡 Status: EM ANÁLISE / RESTRIÇÃO</div></div></div>
    <div class="step"><div class="step-num">3</div><div class="step-body"><h4>Coleta Documental Via Token Seguro</h4><p>Link individual com expiração segura enviado por WhatsApp para o produtor anexar documentos.</p><div class="tip">💡 Status: DOCUMENTAÇÃO PENDENTE</div></div></div>
    <div class="step"><div class="step-num">4</div><div class="step-body"><h4>Considerações Gerenciais & Parecer</h4><p>Validação da capacidade de pagamento, linha de crédito e aprovação preliminar.</p><div class="tip">💡 Status: EMITIR CONSIDERAÇÕES GERENCIAIS</div></div></div>
    <div class="step"><div class="step-num">5</div><div class="step-body"><h4>Autorização e Envio à Centralizadora</h4><p>Dossiê completo transmitido para a esteira final de aprovação bancária.</p><div class="tip">💡 Status: AUTORIZADO ENVIO CENTRAL</div></div></div>
    <div class="step"><div class="step-num">6</div><div class="step-body"><h4>Deferimento e Contratação Final</h4><p>Assinatura do contrato e liberação dos recursos financeiros.</p><div class="tip">💡 Status: CONTRATADO / CONCLUÍDO</div></div></div>
  </div>

  <div class="section">
    <h2>4. Manual do Usuário</h2>
    <div class="step"><div class="step-num">1</div><div class="step-body"><h4>Como Fazer Login</h4><p>Informe sua Matrícula Funcional (Ex: F180227) e senha na tela de login.</p></div></div>
    <div class="step"><div class="step-num">2</div><div class="step-body"><h4>Como Cadastrar Propostas</h4><p>No menu Estoque, clique em "+ Nova Proposta" ou "Importar CSV" para carga em lote.</p></div></div>
    <div class="step"><div class="step-num">3</div><div class="step-body"><h4>Como Gerar Link de Documentação</h4><p>No módulo Documentação, localize o produtor e clique em "Gerar Token Seguro".</p></div></div>
    <div class="step"><div class="step-num">4</div><div class="step-body"><h4>Como Emitir Relatório PDF</h4><p>No Estoque, clique em "Relatório", selecione o modelo e clique em "Gerar PDF Executivo".</p></div></div>
  </div>

  <div class="cta">
    <h3>SuperGestão PRONAF</h3>
    <p>Transformação digital na gestão de crédito rural para agricultura familiar.</p>
    <p style="font-size:12px;color:#64748b">Documento oficial • Versão 2.4 Enterprise</p>
  </div>

  <div class="footer">
    <p>SuperGestão PRONAF • Sistema Integrado de Gestão de Crédito Rural • Documento Oficial</p>
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

  // ─── Modules Data ─────────────────────────────────────────────
  const modules = [
    {
      id: "dashboard",
      title: "Dashboard Executivo",
      route: "/",
      icon: LayoutDashboard,
      badge: "Estratégico",
      gradient: "from-blue-600 to-indigo-700",
      bgLight: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
      description:
        "Visão consolidada dos principais indicadores de crédito, metas e performance operacional.",
      permission: "Todos os perfis com permissão can_view_dashboard",
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
      gradient: "from-indigo-600 to-purple-700",
      bgLight: "bg-indigo-50",
      textColor: "text-indigo-700",
      borderColor: "border-indigo-200",
      description:
        "Esteira completa de propostas para validação, triagem e encaminhamento à Central de Crédito.",
      permission: "Analistas, Gerentes e Administradores (can_view_proposals)",
      features: [
        "Importação em lote de planilhas CSV com detecção inteligente de colunas",
        "Cadastro rápido individual com validação obrigatória de agência",
        "Relatório Executivo Premium em PDF com dashboard embutido",
        "Disparo de mensagens WhatsApp com CPF e CREA/CFTA formatados",
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
      gradient: "from-emerald-600 to-teal-700",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-700",
      borderColor: "border-emerald-200",
      description:
        "Histórico consolidado de contratos deferidos e liquidados na centralizadora.",
      permission: "Equipe de análise e gerência (can_view_proposals)",
      features: [
        "Controle de liquidação e desembolso efetivo dos recursos",
        "Auditoria de tempo de tramitação até a contratação",
        "Exportação de dados para conciliação contábil",
      ],
    },
    {
      id: "documentacao",
      title: "Documentação & Links Seguros",
      route: "/documentacao",
      icon: FolderCheck,
      badge: "Automação Digital",
      gradient: "from-cyan-600 to-blue-700",
      bgLight: "bg-cyan-50",
      textColor: "text-cyan-700",
      borderColor: "border-cyan-200",
      description:
        "Coleta externa de arquivos e certidões dos produtores rurais sem necessidade de login.",
      permission: "Equipe documental (can_view_documentation)",
      features: [
        "Geração de tokens únicos de acesso seguro com prazo configurável",
        "Portal externo mobile-first para upload de documentos e DAP/CAF",
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
      gradient: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-50",
      textColor: "text-amber-700",
      borderColor: "border-amber-200",
      description:
        "Cadastro mestre de profissionais técnicos com sincronização em tempo real.",
      permission: "Operações e Administração (can_view_proposals)",
      features: [
        "Cadastro com Nome, CPF, CREA/CFTA, e-mail e telefone",
        "Edição com propagação em cascata para propostas associadas",
        "Contador dinâmico de propostas por profissional",
        "Exclusão segura e desvinculação de histórico",
      ],
    },
    {
      id: "arquivos",
      title: "Troca de Arquivos",
      route: "/troca-arquivos",
      icon: Share2,
      badge: "Repositório Seguro",
      gradient: "from-violet-600 to-purple-700",
      bgLight: "bg-violet-50",
      textColor: "text-violet-700",
      borderColor: "border-violet-200",
      description:
        "Canal seguro para transferência de projetos técnicos e laudos volumosos.",
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
      gradient: "from-rose-600 to-red-700",
      bgLight: "bg-rose-50",
      textColor: "text-rose-700",
      borderColor: "border-rose-200",
      description:
        "Gestão granular de permissões, perfis e autenticação por matrícula funcional.",
      permission: "Exclusivo Administrador Geral (can_view_access_control)",
      features: [
        "Autenticação corporativa por Matrícula Funcional (Ex: F180227)",
        "Matriz de permissões por tela (Dashboard, Estoque, etc.)",
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
      gradient: "from-slate-700 to-slate-900",
      bgLight: "bg-slate-50",
      textColor: "text-slate-700",
      borderColor: "border-slate-200",
      description:
        "Administração dos polos bancários e isolamento seguro de carteiras.",
      permission: "Exclusivo Administrador Geral (can_manage_agencies)",
      features: [
        "Cadastro de agências com código de compensação e localização",
        "Seletor global de agência no topo da aplicação",
        "Vinculação estrita de usuários às respectivas agências",
      ],
    },
  ];

  // ─── Steps Data ───────────────────────────────────────────────
  const steps = [
    {
      num: "01",
      title: "Acesso & Autenticação",
      resp: "Todos os Usuários",
      status: "Login Inicial",
      desc: "O usuário acessa o sistema informando sua Matrícula Funcional (ex: F180227) e senha cadastrada. Caso possua acesso a múltiplos polos, escolhe a Agência Ativa no cabeçalho superior.",
      tip: "Usuários com perfil de Administrador conseguem alternar entre todas as agências cadastradas.",
      color: "bg-blue-600",
    },
    {
      num: "02",
      title: "Entrada da Proposta no Estoque",
      resp: "Projetista Técnico ou Agência",
      status: "AGUARDANDO ENTREVISTA",
      desc: "A proposta é cadastrada individualmente ou inserida via importação em lote CSV com detecção automática de linhas de crédito, município e projetista.",
      tip: "O sistema valida que nenhuma proposta seja cadastrada sem uma agência bancária vinculada.",
      color: "bg-indigo-600",
    },
    {
      num: "03",
      title: "Análise Cadastral & Restrições",
      resp: "Analista de Crédito Rural",
      status: "EM ANÁLISE / RESTRIÇÃO",
      desc: "Avaliação do enquadramento no PRONAF, conferência do CPF junto ao SERASA/CADIN e validação da titularidade da propriedade rural.",
      tip: "Propostas com restrição são sinalizadas com badge vermelho e monitoradas no indicador de regularidade.",
      color: "bg-purple-600",
    },
    {
      num: "04",
      title: "Coleta Documental Via Link Seguro",
      resp: "Produtor Rural / Analista",
      status: "DOCUMENTAÇÃO PENDENTE",
      desc: "O analista gera um token de acesso seguro no módulo de Documentação. O sistema formata a mensagem WhatsApp para o produtor carregar certidões, DAP/CAF e CAR direto do celular.",
      tip: "O produtor não precisa criar login ou senha; o link temporário valida os anexos com total segurança.",
      color: "bg-cyan-600",
    },
    {
      num: "05",
      title: "Considerações Gerenciais & Parecer",
      resp: "Gerente de Agência",
      status: "EMITIR CONSIDERAÇÕES GERENCIAIS",
      desc: "Elaboração do parecer gerencial, validação do cronograma de desembolso e confirmação das credenciais técnicas do projetista (CREA/CFTA).",
      tip: "Utilize o botão de cópia de texto gerencial para colar os dados estruturados no sistema bancário.",
      color: "bg-amber-600",
    },
    {
      num: "06",
      title: "Autorização & Envio à Centralizadora",
      resp: "Gerência / Mesa de Crédito",
      status: "AUTORIZADO ENVIO CENTRAL",
      desc: "A proposta recebe autorização formal e o status muda para 'AUTORIZADO ENVIO CENTRAL', registrando data e analista responsável.",
      tip: "Nesta etapa, o relatório executivo em PDF pode ser emitido como resumo de lote para encaminhamento.",
      color: "bg-emerald-600",
    },
    {
      num: "07",
      title: "Deferimento & Contratação Final",
      resp: "Central de Crédito",
      status: "APROVADA / CONTRATADO",
      desc: "Emissão da Cédula de Crédito Bancário, assinatura formal e migração do registro para o módulo de Propostas Concluídas com liquidação do valor.",
      tip: "A proposta alimenta os gráficos de desembolso e performance do Dashboard Executivo.",
      color: "bg-teal-600",
    },
  ];

  // ─── Animated Stats ───────────────────────────────────────────
  const stat1 = useAnimatedNumber(8);
  const stat2 = useAnimatedNumber(7);
  const stat3 = useAnimatedNumber(6);

  const toc = [
    { id: "visao-geral", label: "Visão Geral", num: "1" },
    { id: "metricas", label: "Plataforma em Números", num: "2" },
    { id: "modulos", label: "Módulos do Sistema", num: "3" },
    { id: "fluxo", label: "Fluxo de Tramitação", num: "4" },
    { id: "manual", label: "Manual do Usuário", num: "5" },
    { id: "consideracoes", label: "Conclusão", num: "6" },
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] animate-in fade-in duration-500">
      {/* ═══════════════════ HERO HEADER ═══════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-32 -top-32 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl" />
          <div className="absolute right-1/3 bottom-0 w-[500px] h-[500px] bg-indigo-500/6 rounded-full blur-3xl" />
          <div className="absolute left-10 top-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-10 pb-12 md:pt-16 md:pb-16">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <BookOpen className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-white/60 font-semibold text-sm tracking-wide">
                SuperGestão <span className="text-white/30">•</span>{" "}
                <span className="text-emerald-400/80">PRONAF</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-white/10 text-white/70 border-white/10 text-[10px] px-3 py-1 font-semibold tracking-wider uppercase">
                v2.4 Enterprise
              </Badge>
            </div>
          </div>

          {/* Hero content */}
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/20 rounded-full px-4 py-1.5">
              <CircleDot className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-300 text-xs font-bold tracking-wide uppercase">
                Documentação Oficial & Guia Operacional
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-white tracking-tight leading-[1.1]">
              Documentação da
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Plataforma
              </span>
            </h1>

            <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-2xl">
              Manual técnico completo com especificação de módulos, fluxo
              operacional ponta a ponta e guia passo a passo do ecossistema de
              crédito rural PRONAF.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Button
              onClick={handleDownloadStandaloneHTML}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-xl shadow-emerald-500/20 h-11 px-6 rounded-xl"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar Documentação (HTML)
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10 font-semibold h-11 px-6 rounded-xl backdrop-blur-sm"
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* ═══════════════════ MAIN LAYOUT ═══════════════════ */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex gap-10">
          {/* ─── Sticky TOC Sidebar (Desktop) ─── */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-6 space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] px-3 mb-3">
                Neste documento
              </p>
              {toc.map((item) => (
                <TocItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  num={item.num}
                  active={activeSection === item.id}
                  onClick={() => scrollTo(item.id)}
                />
              ))}
              <div className="pt-6 mt-6 border-t border-slate-200/80 px-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3">
                  Ações Rápidas
                </p>
                <button
                  onClick={handleDownloadStandaloneHTML}
                  className="flex items-center gap-2 text-xs text-slate-500 hover:text-emerald-600 transition-colors w-full py-1.5 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download HTML
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 text-xs text-slate-500 hover:text-emerald-600 transition-colors w-full py-1.5 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Imprimir Página
                </button>
              </div>
            </div>
          </aside>

          {/* ─── Mobile TOC Toggle ─── */}
          <div className="lg:hidden fixed bottom-6 right-6 z-50">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-12 w-12 rounded-full bg-slate-900 text-white shadow-2xl shadow-slate-900/40 flex items-center justify-center cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            {mobileMenuOpen && (
              <div className="absolute bottom-16 right-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 space-y-1 animate-in slide-in-from-bottom-4 duration-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] px-3 py-1">
                  Navegação
                </p>
                {toc.map((item) => (
                  <TocItem
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    num={item.num}
                    active={activeSection === item.id}
                    onClick={() => scrollTo(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ─── Main Content ─── */}
          <main className="flex-1 min-w-0 space-y-14">
            {/* ═══ SECTION 1: VISÃO GERAL ═══ */}
            <section id="visao-geral" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  1
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Visão Geral
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Propósito estratégico e arquitetura de negócios
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
                <p className="text-[15px] text-slate-600 leading-[1.8] mb-6">
                  O{" "}
                  <strong className="text-slate-900">
                    SuperGestão (PRONAF)
                  </strong>{" "}
                  é uma plataforma integrada de gestão estratégica concebida
                  para otimizar o ciclo de vida do crédito rural para a
                  agricultura familiar. Centraliza dados de produtores,
                  projetos técnicos, conferência documental e transmissão para
                  a centralizadora de crédito bancário — eliminando o trâmite
                  de papéis dispersos e reduzindo o tempo de contratação de
                  semanas para poucos dias.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      icon: Workflow,
                      title: "Rastreabilidade Total",
                      desc: "Cada proposta possui histórico auditável, carimbo de data/hora, projetista responsável e estágio exato na esteira.",
                      color: "bg-indigo-50 border-indigo-100",
                      iconColor: "text-indigo-600",
                      titleColor: "text-indigo-900",
                    },
                    {
                      icon: Smartphone,
                      title: "Envio Seguro Sem Senha",
                      desc: "O produtor rural carrega certidões e comprovantes diretamente do celular através de link temporário e token seguro.",
                      color: "bg-emerald-50 border-emerald-100",
                      iconColor: "text-emerald-600",
                      titleColor: "text-emerald-900",
                    },
                    {
                      icon: Shield,
                      title: "Segurança & Isolamento",
                      desc: "Governança multiagências com proteção em nível de banco de dados (Row Level Security no PostgreSQL/Supabase).",
                      color: "bg-amber-50 border-amber-100",
                      iconColor: "text-amber-600",
                      titleColor: "text-amber-900",
                    },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={i}
                        className={`p-5 rounded-2xl border ${item.color} space-y-3`}
                      >
                        <div
                          className={`flex items-center gap-2.5 ${item.titleColor} font-bold text-sm`}
                        >
                          <Icon className={`h-4.5 w-4.5 ${item.iconColor}`} />
                          {item.title}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ═══ SECTION 2: MÉTRICAS DA PLATAFORMA ═══ */}
            <section id="metricas" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  2
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Plataforma em Números
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Indicadores-chave do ecossistema
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    ref: stat1.ref,
                    value: stat1.value,
                    label: "Módulos Integrados",
                    suffix: "",
                    gradient: "from-blue-600 to-indigo-600",
                    icon: Layers,
                  },
                  {
                    ref: stat2.ref,
                    value: stat2.value,
                    label: "Etapas de Tramitação",
                    suffix: "",
                    gradient: "from-purple-600 to-violet-600",
                    icon: Workflow,
                  },
                  {
                    ref: stat3.ref,
                    value: stat3.value,
                    label: "Perfis de Acesso",
                    suffix: "",
                    gradient: "from-emerald-600 to-teal-600",
                    icon: Users,
                  },
                  {
                    ref: null,
                    value: null,
                    label: "Disponibilidade Cloud",
                    suffix: "24/7",
                    gradient: "from-amber-500 to-orange-600",
                    icon: Globe,
                  },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={i}
                      ref={stat.ref}
                      className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="flex justify-center mb-3">
                        <div
                          className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                        {stat.suffix || stat.value}
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-1.5">
                        {stat.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ═══ SECTION 3: MÓDULOS DO SISTEMA ═══ */}
            <section id="modulos" className="scroll-mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                    3
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      Módulos do Sistema
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      8 telas com funcionalidades detalhadas
                    </p>
                  </div>
                </div>
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                  <Input
                    placeholder="Buscar módulo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-sm rounded-xl border-slate-200 bg-white focus-visible:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {modules
                  .filter(
                    (m) =>
                      m.title
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      m.description
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                  )
                  .map((mod) => {
                    const Icon = mod.icon;
                    return (
                      <div
                        key={mod.id}
                        className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden group"
                      >
                        <Expandable
                          title=""
                          defaultOpen={mod.id === "estoque"}
                        >
                          <div className="space-y-4">
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {mod.description}
                            </p>

                            <div
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${mod.bgLight} border ${mod.borderColor}`}
                            >
                              <Lock className="h-3 w-3 text-slate-400" />
                              <span className="text-[11px] font-semibold text-slate-600">
                                {mod.permission}
                              </span>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3">
                                Principais Recursos
                              </p>
                              <ul className="space-y-2">
                                {mod.features.map((feat, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2.5 text-sm text-slate-600"
                                  >
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <span>{feat}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </Expandable>

                        {/* Module header rendered outside Expandable */}
                        <div className="flex items-center gap-4 px-5 py-4 border-t border-slate-100 -mt-px">
                          <div
                            className={`h-10 w-10 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center text-white shadow-sm flex-shrink-0`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5">
                              <h3 className="font-bold text-sm text-slate-900 truncate">
                                {mod.title}
                              </h3>
                              <Badge
                                className={`text-[9px] font-bold tracking-wider uppercase ${mod.bgLight} ${mod.textColor} border-0 px-2`}
                              >
                                {mod.badge}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {mod.route}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>

            {/* ═══ SECTION 4: FLUXO DE TRAMITAÇÃO ═══ */}
            <section id="fluxo" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  4
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Fluxo de Tramitação
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Ciclo de vida completo de uma proposta PRONAF
                  </p>
                </div>
              </div>

              {/* Visual Pipeline */}
              <div className="bg-slate-950 rounded-2xl p-6 md:p-8 mb-8 overflow-x-auto shadow-lg">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">
                  Pipeline de Estados
                </p>
                <div className="flex items-center gap-2 min-w-[800px]">
                  {[
                    {
                      label: "Estoque",
                      sub: "Aguardando",
                      color: "bg-blue-600/90",
                    },
                    {
                      label: "Triagem",
                      sub: "Análise",
                      color: "bg-indigo-600/90",
                    },
                    {
                      label: "Documentação",
                      sub: "Token Seguro",
                      color: "bg-purple-600/90",
                    },
                    {
                      label: "Parecer",
                      sub: "Gerencial",
                      color: "bg-amber-600/90",
                    },
                    {
                      label: "Central",
                      sub: "Envio",
                      color: "bg-emerald-600/90",
                    },
                    {
                      label: "Concluído",
                      sub: "Contratado",
                      color:
                        "bg-gradient-to-r from-emerald-500 to-teal-500 ring-1 ring-emerald-400/30",
                    },
                  ].map((node, i) => (
                    <div key={i} className="flex items-center gap-2 flex-1">
                      <div
                        className={`${node.color} rounded-xl p-3 md:p-4 flex-1 min-w-[110px] text-center shadow-lg`}
                      >
                        <span className="block text-[10px] text-white/60 font-bold uppercase tracking-wider">
                          {node.label}
                        </span>
                        <strong className="block text-xs text-white font-bold mt-0.5">
                          {node.sub}
                        </strong>
                      </div>
                      {i < 5 && (
                        <ChevronRight className="h-4 w-4 text-slate-600 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Steps */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                  Detalhamento por Etapa
                </p>
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[19px] top-8 bottom-8 w-px bg-gradient-to-b from-blue-200 via-purple-200 to-emerald-200 hidden md:block" />

                  <div className="space-y-4">
                    {steps.map((st) => (
                      <div key={st.num} className="flex gap-4 group">
                        {/* Step indicator */}
                        <div className="flex-shrink-0 relative z-10">
                          <div
                            className={`h-10 w-10 rounded-xl ${st.color} text-white flex items-center justify-center font-extrabold text-xs shadow-md`}
                          >
                            {st.num}
                          </div>
                        </div>

                        {/* Step content */}
                        <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <h4 className="font-bold text-sm text-slate-900">
                              {st.title}
                            </h4>
                            <Badge
                              variant="outline"
                              className="text-[9px] font-bold tracking-wide"
                            >
                              {st.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 leading-relaxed mb-3">
                            {st.desc}
                          </p>
                          <div className="flex items-center gap-4 text-[11px]">
                            <span className="text-slate-400">
                              <strong className="text-slate-500">
                                Responsável:
                              </strong>{" "}
                              {st.resp}
                            </span>
                          </div>
                          <div className="mt-3 p-3 rounded-xl bg-emerald-50/80 border border-emerald-100 text-[11px] text-emerald-800 leading-snug">
                            <strong>💡 Dica:</strong> {st.tip}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ═══ SECTION 5: MANUAL DO USUÁRIO ═══ */}
            <section id="manual" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  5
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Manual do Usuário
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Guia passo a passo para operação diária
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                {[
                  {
                    num: "01",
                    title: "Como Fazer Login no Sistema",
                    desc: (
                      <>
                        Na tela de login (
                        <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                          /auth
                        </code>
                        ), digite sua{" "}
                        <strong className="text-slate-800">
                          Matrícula Funcional
                        </strong>{" "}
                        (ex: F180227) e a senha pessoal. Clique em{" "}
                        <strong className="text-slate-800">Entrar</strong>.
                        Administradores podem alternar entre agências usando o
                        seletor no cabeçalho superior.
                      </>
                    ),
                    icon: Lock,
                  },
                  {
                    num: "02",
                    title: "Como Selecionar e Alternar Agências",
                    desc: "No canto superior da tela, utilize o seletor com ícone de agência bancária para escolher o polo operacional. Todos os números e gráficos se adaptarão automaticamente à agência selecionada.",
                    icon: Building2,
                  },
                  {
                    num: "03",
                    title: "Como Cadastrar ou Importar Propostas",
                    desc: (
                      <>
                        No menu <strong>Estoque</strong>, clique em{" "}
                        <strong>+ Nova Proposta</strong> para entrada avulsa ou{" "}
                        <strong>Importar CSV</strong> para carga em lote. O
                        sistema valida e vincula as propostas à agência ativa.
                      </>
                    ),
                    icon: FileSpreadsheet,
                  },
                  {
                    num: "04",
                    title: "Como Gerar Link Seguro de Documentação",
                    desc: (
                      <>
                        Acesse <strong>Documentação</strong>, localize a
                        proposta e clique em{" "}
                        <strong>Gerar Token Seguro</strong>. Use o botão
                        WhatsApp para enviar a mensagem automática ao produtor
                        com o link exclusivo de upload.
                      </>
                    ),
                    icon: ExternalLink,
                  },
                  {
                    num: "05",
                    title: "Como Emitir o Relatório Executivo em PDF",
                    desc: (
                      <>
                        No topo do <strong>Estoque</strong>, clique em{" "}
                        <strong>Relatório</strong>. Selecione o modelo
                        (Completo, Dashboard ou Listagem Analítica), filtre os
                        dados e clique em{" "}
                        <strong>Gerar PDF Executivo</strong>.
                      </>
                    ),
                    icon: BarChart3,
                  },
                  {
                    num: "06",
                    title: "Como Cadastrar e Gerenciar Projetistas",
                    desc: (
                      <>
                        No menu <strong>Projetistas</strong>, visualize o
                        painel com propostas vinculadas. Clique em{" "}
                        <strong>+ Novo Projetista</strong> ou edite para
                        atualizar CPF e CREA/CFTA — todas as propostas
                        atreladas são atualizadas em tempo real.
                      </>
                    ),
                    icon: UserCheck,
                  },
                ].map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.num}
                      className={`flex items-start gap-5 p-6 ${
                        i > 0 ? "border-t border-slate-100" : ""
                      } hover:bg-slate-50/50 transition-colors`}
                    >
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
                          {step.num}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-slate-400" />
                          <h4 className="font-bold text-sm text-slate-900">
                            {step.title}
                          </h4>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ═══ SECTION 6: CONSIDERAÇÕES FINAIS ═══ */}
            <section id="consideracoes" className="scroll-mt-8">
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-2xl p-8 md:p-12 shadow-xl">
                {/* Decorative */}
                <div className="absolute -right-20 -top-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Award className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-white tracking-tight">
                        Considerações Finais
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        Impacto da transformação digital no crédito PRONAF
                      </p>
                    </div>
                  </div>

                  <p className="text-[15px] text-slate-300 leading-[1.8] max-w-3xl">
                    A implantação do{" "}
                    <strong className="text-white">
                      SuperGestão PRONAF
                    </strong>{" "}
                    consolida um novo patamar de excelência para a gestão de
                    crédito rural. Ao combinar rigor de conformidade bancária
                    com interfaces modernas e fluxos ágeis via mobile, a
                    instituição financeira garante segurança documental
                    integral, auditoria contínua e um relacionamento ágil com o
                    homem do campo e projetistas técnicos credenciados.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    {[
                      {
                        icon: Zap,
                        title: "Velocidade",
                        desc: "Redução do tempo de tramitação de semanas para poucos dias",
                      },
                      {
                        icon: Target,
                        title: "Precisão",
                        desc: "Eliminação de erros documentais e retrabalho operacional",
                      },
                      {
                        icon: TrendingUp,
                        title: "Escalabilidade",
                        desc: "Arquitetura cloud-native preparada para crescimento contínuo",
                      },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={i}
                          className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2"
                        >
                          <Icon className="h-5 w-5 text-emerald-400" />
                          <p className="text-sm font-bold text-white">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4">
                    <Button
                      onClick={handleDownloadStandaloneHTML}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-xl shadow-emerald-500/20 h-11 px-6 rounded-xl"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Documentação (HTML)
                    </Button>
                    <Button
                      onClick={() => window.print()}
                      variant="outline"
                      className="border-white/15 bg-white/5 text-white hover:bg-white/10 font-semibold h-11 px-6 rounded-xl backdrop-blur-sm"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="text-center pt-4 pb-8">
              <p className="text-xs text-slate-300">
                SuperGestão PRONAF • Sistema Integrado de Gestão de Crédito
                Rural • Documento Oficial
              </p>
              <p className="text-[10px] text-slate-300 mt-1">
                © {new Date().getFullYear()} — Versão 2.4 Enterprise
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* ═══ Scroll to Top Button ═══ */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 left-6 z-50 h-10 w-10 rounded-full bg-slate-900 text-white shadow-2xl shadow-slate-900/40 flex items-center justify-center hover:bg-slate-800 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-300 cursor-pointer lg:bottom-6 lg:left-auto lg:right-6"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
