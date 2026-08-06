export interface VisitaGerencialParams {
  producerName?: string | null;
  producerCpf?: string | null;
  creditProgram?: string | null;
  projetista?: string | null;
  projetistaCpf?: string | null;
  projetistaCreaCfta?: string | null;
  estimatedValue?: number | null;
  municipio?: string | null;
  localizacao?: string | null;
  parecerObs?: string | null;
}

export function generateVisitaGerencialText(params: VisitaGerencialParams): string {
  const nome = (params.producerName || "—").toUpperCase();
  const programa = (params.creditProgram || "PRONAF A").toUpperCase();
  const projetistaNome = (params.projetista || "—").toUpperCase();
  const valor = params.estimatedValue
    ? params.estimatedValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";

  // Formata os dados cadastrados do projetista (Nome, CPF, CREA/CFTA)
  let infoProjetista = projetistaNome;
  const detalhesProjetista: string[] = [];

  if (params.projetistaCpf && params.projetistaCpf.trim() !== "" && params.projetistaCpf !== "—") {
    detalhesProjetista.push(`CPF ${params.projetistaCpf.trim()}`);
  }
  if (params.projetistaCreaCfta && params.projetistaCreaCfta.trim() !== "" && params.projetistaCreaCfta !== "—") {
    detalhesProjetista.push(`CREA/CFTA ${params.projetistaCreaCfta.trim()}`);
  }

  if (detalhesProjetista.length > 0) {
    infoProjetista += `, ${detalhesProjetista.join(", ")}`;
  }

  const line1 = `Proponente: ${nome}`;
  const line2 = `Valor: ${valor}`;
  const line3 = `Programa de Crédito: ${programa}`;
  const line4 = `A proposta enquadra-se na modalidade ${programa}, com investimentos destinados ao fortalecimento da unidade produtiva e à melhoria da capacidade produtiva do beneficiário.`;
  const line5 = `Os investimentos são compatíveis com a realidade da propriedade, apresentando viabilidade técnica e econômica. O crédito contribuirá para o desenvolvimento sustentável da atividade rural.`;
  const line6 = `O projeto foi elaborado e acompanhado pelo projetista responsável ${infoProjetista}.`;

  return `${line1}\n${line2}\n${line3}\n${line4}\n${line5}\n${line6}`;
}
