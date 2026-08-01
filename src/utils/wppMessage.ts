import { DOCUMENTATION_REQUIRED, AGENCY_DOCUMENTATION, getDocLabel } from "@/types/documentation";

export interface WppMessageParams {
  producerName?: string | null;
  producerCpf?: string | null;
  creditProgram?: string | null;
  estimatedValue?: number | null;
  municipio?: string | null;
  projetista?: string | null;
  proposalStatus?: string | null;
  token?: string | null;
  files?: Array<{
    document_type: string;
    status: string;
    rejection_reason?: string | null;
    file_path?: string;
  }>;
  inversoes?: {
    status?: string;
    rejection_reason?: string | null;
  } | null;
}

export function generateWppStatusMessage(params: WppMessageParams): string {
  const nome = params.producerName || "—";
  const cpf = params.producerCpf || "—";
  const programa = params.creditProgram || "—";
  const valor = params.estimatedValue
    ? params.estimatedValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";
  const municipio = params.municipio || "—";
  const projetista = params.projetista || "—";

  const rawLink = params.token
    ? `${window.location.origin}/enviar-documentacao?token=${params.token}`
    : "";
  // Strip protocol (https:// or http://) to prevent WhatsApp from generating a top link-preview box
  const linkEnvio = rawLink.replace(/^https?:\/\//i, "");

  const now = new Date();
  const dataHoje = now.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const horaHoje = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dataHoraFormatada = `${dataHoje} às ${horaHoje}`;

  const files = params.files || [];

  // Build map of most recent files by doc type
  const bestByType = new Map<string, typeof files[0]>();
  const grouped = new Map<string, typeof files>();
  files.forEach((f) => {
    const list = grouped.get(f.document_type) || [];
    list.push(f);
    grouped.set(f.document_type, list);
  });
  grouped.forEach((fileList, docType) => {
    bestByType.set(docType, fileList[0]);
  });

  // Add virtual cards for missing required docs
  DOCUMENTATION_REQUIRED.forEach((doc) => {
    if (!bestByType.has(doc.key)) {
      bestByType.set(doc.key, {
        document_type: doc.key,
        status: "pendente",
        rejection_reason: null,
        file_path: "habilitado",
      });
    }
  });

  const allFiles = [...bestByType.values()];
  const dispensadosSet = new Set(
    allFiles
      .filter((f) => f.file_path === "dispensado" || f.file_path === "preenchido")
      .map((f) => f.document_type)
  );

  const pendentes: string[] = [];
  const reprovados: { label: string; motivo: string }[] = [];
  let totalAprovados = 0;
  let totalDocs = 0;

  allFiles.forEach((f) => {
    if (dispensadosSet.has(f.document_type)) return;
    if (AGENCY_DOCUMENTATION.some((ad) => ad.key === f.document_type)) return;

    totalDocs++;
    const label = getDocLabel(f.document_type);

    if (f.status === "aprovado") {
      totalAprovados++;
    } else if (f.status === "reprovado") {
      reprovados.push({
        label,
        motivo: f.rejection_reason || "Motivo não informado",
      });
    } else if (f.status === "pendente") {
      pendentes.push(label);
    }
  });

  // Check inversões rejection
  const isInversoesReprovadas = params.inversoes?.status === "reprovado";
  const motivoInversoes = params.inversoes?.rejection_reason || "";

  // ── Always start with Header & Proposal Info ──
  let msg = `📋 *PRONAF - STATUS DA PROPOSTA*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📅 *Data:* ${dataHoraFormatada}\n\n`;
  msg += `👤 *Proponente:* ${nome}\n`;
  msg += `🆔 *CPF:* ${cpf}\n`;
  msg += `🏦 *Programa:* ${programa}\n`;
  msg += `💰 *Valor:* ${valor}\n`;
  msg += `📍 *Município:* ${municipio}\n`;
  if (projetista && projetista !== "—") {
    msg += `👷 *Projetista:* ${projetista}\n`;
  }
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const proposalStatus = (params.proposalStatus || "").toUpperCase();

  if (proposalStatus === "CONCLUÍDO" || proposalStatus === "CONCLUIDO") {
    msg += `✅ Em *${dataHoraFormatada}*, a proposta encontra-se *CONCLUÍDA*.\n\n`;
    if (totalDocs > 0) {
      msg += `📊 *Documentação:* ${totalAprovados}/${totalDocs} documentos aprovados.\n\n`;
    }
    msg += `A proposta foi finalizada com sucesso. Caso necessite de mais informações, entre em contato com a agência.`;
  } else if (proposalStatus === "ENVIADO PARA CENTRAL") {
    msg += `📤 Em *${dataHoraFormatada}*, a proposta encontra-se *ENVIADA PARA A CENTRAL* e em fase de análise.\n\n`;
    if (totalDocs > 0) {
      msg += `📊 *Documentação:* ${totalAprovados}/${totalDocs} documentos aprovados.\n\n`;
    }
    msg += `Aguarde a análise e acompanhe o andamento pelo link abaixo:\n`;
    if (linkEnvio) msg += `🔗 ${linkEnvio}`;
  } else if (pendentes.length === 0 && reprovados.length === 0 && !isInversoesReprovadas) {
    msg += `✅ Em *${dataHoraFormatada}*, a proposta encontra-se *em andamento e análise*.\n\n`;
    if (totalDocs > 0) {
      msg += `📊 *Documentação:* ${totalAprovados}/${totalDocs} documentos aprovados. ✅ *Todos os documentos foram aprovados!*\n\n`;
    }
    msg += `Nenhuma pendência documental. Aguarde o processamento da proposta e acompanhe o andamento pelo link abaixo:\n`;
    if (linkEnvio) msg += `🔗 ${linkEnvio}`;
  } else {
    msg += `⚠️ Em *${dataHoraFormatada}*, a proposta encontra-se *em andamento e análise* com pendências/reprovações.\n\n`;
    if (totalDocs > 0) {
      msg += `📊 *Progresso:* ${totalAprovados}/${totalDocs} documentos aprovados | ${pendentes.length} pendente(s) | ${reprovados.length} reprovado(s)\n\n`;
    }

    if (pendentes.length > 0) {
      msg += `⏳ *DOCUMENTOS PENDENTES (${pendentes.length}):*\n`;
      pendentes.forEach((p, i) => {
        msg += `   ${i + 1}. ${p}\n`;
      });
      msg += `\n`;
    }

    if (reprovados.length > 0) {
      msg += `❌ *DOCUMENTOS REPROVADOS (${reprovados.length}):*\n`;
      reprovados.forEach((r, i) => {
        msg += `   ${i + 1}. ${r.label}\n`;
        msg += `      _Motivo: ${r.motivo}_\n`;
      });
      msg += `\n`;
    }

    if (isInversoesReprovadas) {
      msg += `❌ *INVERSÕES DO PLANO REPROVADAS:*\n`;
      msg += `   _Motivo: ${motivoInversoes || "Motivo não informado"}_\n\n`;
    }

    msg += `📎 Favor regularizar e reenviar os documentos pelo link abaixo:\n`;
    if (linkEnvio) msg += `🔗 ${linkEnvio}`;
  }

  return msg;
}
