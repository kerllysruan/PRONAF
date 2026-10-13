/**
 * Validador de nomes e logradouros (ValidaNome do VBA mdlCritica.bas).
 * Contém regras para Pessoa Física (PF), Pessoa Jurídica (PJ) e Endereço/Logradouro ("J").
 */

/**
 * Verifica se a string contém 3 ou mais caracteres consecutivos idênticos.
 * Ex.: "aaa", "111", "---".
 *
 * @param str Texto a verificar
 * @returns true se houver 3 ou mais caracteres idênticos consecutivos
 */
export function hasConsecutiveIdenticalChars(str: string): boolean {
  return /(.)\1{2}/i.test(str);
}

/**
 * Valida o nome de Pessoa Física de acordo com as regras rígidas do BACEN/VBA:
 * - Não pode ser vazio e deve ter até 55 caracteres
 * - Não pode iniciar com espaço
 * - Não pode conter 3 ou mais caracteres idênticos consecutivos
 * - O primeiro nome deve possuir mais de 1 letra
 * - Não pode conter abreviações (proibido conter '.' ou ',')
 * - Nenhum dos nomes/sobrenomes pode ter menos de 2 letras (sem iniciais isoladas)
 * - Se tiver menos de 30 caracteres, deve possuir no mínimo 2 nomes (nome composto / sobrenome)
 * - Não pode iniciar com "NAO " ou "NÃO " (ex.: "Não consta", "Não informado")
 * - Não pode terminar com ponto '.'
 *
 * @param value Nome a validar
 * @returns true se o nome for válido para Pessoa Física
 */
export function validateNomePF(value: string): boolean {
  if (!value) return false;

  // Primeiro caractere não pode ser espaço
  if (value.startsWith(' ')) {
    return false;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 55) {
    return false;
  }

  // Sequência de 3 ou mais caracteres repetidos
  if (hasConsecutiveIdenticalChars(trimmed)) {
    return false;
  }

  // Não pode iniciar com "NAO " ou "NÃO "
  const upper = trimmed.toUpperCase();
  if (upper.startsWith('NAO ') || upper.startsWith('NÃO ')) {
    return false;
  }

  // Não pode terminar com ponto
  if (trimmed.endsWith('.')) {
    return false;
  }

  // Pessoa Física não pode conter abreviações (pontos ou vírgulas)
  if (trimmed.includes('.') || trimmed.includes(',')) {
    return false;
  }

  // Se tiver menos de 30 caracteres, precisa de pelo menos 2 nomes (espaço intermediário)
  if (trimmed.length < 30 && !trimmed.includes(' ')) {
    return false;
  }

  // Quebra os nomes por espaços múltiplos ou únicos
  const partes = trimmed.split(/\s+/).filter(Boolean);

  // Primeiro nome deve ter mais de uma letra (pelo menos 2 caracteres)
  if (partes.length > 0 && partes[0].length < 2) {
    return false;
  }

  // Nenhum dos nomes pode ter menos de 2 letras
  for (const parte of partes) {
    if (parte.length < 2) {
      return false;
    }
  }

  return true;
}

/**
 * Valida o nome de Pessoa Jurídica (Razão Social / Nome de Fantasia):
 * - Não pode ser vazio e deve ter até 55 caracteres
 * - Não pode iniciar com espaço
 * - Não pode conter 3 ou mais caracteres idênticos consecutivos
 * - Não pode iniciar com "NAO " ou "NÃO "
 * - Não pode terminar com ponto isolado no final sem justificativa
 * - Permite siglas e abreviações societárias típicas (ex.: S.A., LTDA, EPP, ME)
 *
 * @param value Razão Social / Nome PJ a validar
 * @returns true se for válido para Pessoa Jurídica
 */
export function validateNomePJ(value: string): boolean {
  if (!value) return false;

  // Não pode iniciar com espaço
  if (value.startsWith(' ')) {
    return false;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 55) {
    return false;
  }

  // Sequência de 3 ou mais caracteres repetidos
  if (hasConsecutiveIdenticalChars(trimmed)) {
    return false;
  }

  // Não pode iniciar com "NAO " ou "NÃO "
  const upper = trimmed.toUpperCase();
  if (upper.startsWith('NAO ') || upper.startsWith('NÃO ')) {
    return false;
  }

  return true;
}

/**
 * Valida Endereço / Logradouro (Modo "J" do VBA ValidaNome):
 * - Não pode ser vazio e deve ter até 45 caracteres
 * - Não pode iniciar com espaço
 * - Não pode conter 3 ou mais caracteres idênticos consecutivos
 *
 * @param value Endereço / Logradouro a validar
 * @returns true se for válido
 */
export function validateNomeEndereco(value: string): boolean {
  if (!value) return false;

  // Não pode iniciar com espaço
  if (value.startsWith(' ')) {
    return false;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 45) {
    return false;
  }

  // Sequência de 3 ou mais caracteres repetidos
  if (hasConsecutiveIdenticalChars(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Retorna a mensagem de erro detalhada da validação de Nome de Pessoa Física,
 * ou null caso seja válido.
 *
 * @param value Nome informado
 * @returns Mensagem de erro em pt-BR ou null se válido
 */
export function getNomePFValidationError(value: string): string | null {
  if (!value || value.trim().length === 0) {
    return 'O campo Nome é obrigatório!';
  }

  if (value.startsWith(' ')) {
    return 'O primeiro caracter de um NOME não pode ser vazio!';
  }

  const trimmed = value.trim();
  if (trimmed.length > 55) {
    return 'O nome deve ter no máximo 55 caracteres!';
  }

  if (hasConsecutiveIdenticalChars(trimmed)) {
    return 'Sequência de caracteres inválida (caracteres repetidos)!';
  }

  const upper = trimmed.toUpperCase();
  if (upper.startsWith('NAO ') || upper.startsWith('NÃO ')) {
    return 'Sequência inicial de caracteres inválida!';
  }

  if (trimmed.endsWith('.')) {
    return 'O último caracter de um NOME não pode ser um ponto!';
  }

  if (trimmed.includes('.') || trimmed.includes(',')) {
    return 'O nome de pessoa física não pode ser abreviado!';
  }

  if (trimmed.length < 30 && !trimmed.includes(' ')) {
    return 'O campo Nome deve ser composto por pelo menos 2 nomes!';
  }

  const partes = trimmed.split(/\s+/).filter(Boolean);
  if (partes.length > 0 && partes[0].length < 2) {
    return 'O primeiro NOME do cliente deve possuir mais de uma letra!';
  }

  for (const parte of partes) {
    if (parte.length < 2) {
      return 'Nenhum dos nomes pode possuir apenas 1 letra!';
    }
  }

  return null;
}
