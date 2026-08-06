export interface VisitaGerencialParams {
  producerName?: string | null;
  producerCpf?: string | null;
  creditProgram?: string | null;
  projetista?: string | null;
  estimatedValue?: number | null;
  municipio?: string | null;
  localizacao?: string | null;
  parecerObs?: string | null;
}

export function generateVisitaGerencialText(params: VisitaGerencialParams): string {
  const nome = (params.producerName || "—").toUpperCase();
  const programa = (params.creditProgram || "PRONAF A").toUpperCase();
  const projetista = params.projetista || "—";
  const valor = params.estimatedValue
    ? params.estimatedValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";

  const line1 = `Proponente: ${nome}`;
  const line2 = `Valor: ${valor}`;
  const line3 = `Programa de Crédito: ${programa}`;
  const line4 = `A proposta enquadra-se na modalidade ${programa}, com investimentos destinados ao fortalecimento da unidade produtiva e à melhoria da capacidade produtiva do beneficiário.`;
  const line5 = `Os investimentos são compatíveis com a realidade da propriedade, apresentando viabilidade técnica e econômica. O crédito contribuirá para o desenvolvimento sustentável da atividade rural.`;
  const line6 = `O projeto foi elaborado e acompanhado pelo projetista responsável ${projetista}.`;

  return `${line1}\n${line2}\n${line3}\n${line4}\n${line5}\n${line6}`;
}
