import { z } from "zod";
import {
  validateCPF,
  validateCNPJ,
  validateCPFouCNPJ,
  validateNomePF,
  validateNomeEndereco,
  validateDate,
  validateNumeroEndereco,
  validateCEP,
} from "../validators";

/**
 * Converte string de data no formato dd/mm/aaaa ou ISO para objeto Date
 */
function parseDateString(val?: string | null): Date | null {
  if (!val || typeof val !== "string") return null;
  const s = val.trim();
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = s.match(ddmmyyyy);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Schema Zod para o formulÃ¡rio da aba Cliente (Planilha PRONAF A2)
 * Cobre todas as cÃ©lulas de entrada de data/campos_Cliente.csv
 */
export const clienteSchema = z
  .object({
    // ------------------------------------------------------------------------
    // Bloco A: Dados cadastrais do(a) cliente
    // ------------------------------------------------------------------------

    // E12 - Tipo Cliente ("Pessoa FÃ­sica" | "Pessoa JurÃ­dica")
    E12: z.enum(["Pessoa FÃ­sica", "Pessoa JurÃ­dica"], {
      errorMap: () => ({ message: "Selecione o Tipo de Cliente (Pessoa FÃ­sica ou Pessoa JurÃ­dica)." }),
    }).default("Pessoa FÃ­sica"),

    // E13 - Nome / RazÃ£o Social (ObrigatÃ³rio, <= 55 caracteres)
    E13: z
      .string({ required_error: "Nome Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "O nome informado Ã© obrigatÃ³rio." })
      .max(55, { message: "O nome deve ter no mÃ¡ximo 55 caracteres." })
      .refine(
        (val) => validateNomePF(val) || validateNomeEndereco(val),
        { message: "O nome informado nÃ£o Ã© vÃ¡lido ou excede o limite de caracteres (mÃ¡ximo 55 caracteres)." }
      ),

    // E14 - Apelido / Nome Fantasia (Opcional, <= 20 caracteres)
    E14: z
      .string()
      .max(20, { message: "MÃ¡ximo de 20 caracteres." })
      .optional()
      .or(z.literal("")),

    // E15 - C.P.F. / C.N.P.J. (ObrigatÃ³rio)
    E15: z
      .string({ required_error: "CPF / CNPJ Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Informe o CPF ou CNPJ." }),

    // E16 - Data de Nascimento / ConstituiÃ§Ã£o (ObrigatÃ³rio, date <= hoje)
    E16: z
      .string({ required_error: "Data de nascimento Ã© obrigatÃ³ria." })
      .trim()
      .min(1, { message: "Data de nascimento Ã© obrigatÃ³ria." })
      .refine(validateDate, { message: "Data invÃ¡lida ou futura." }),

    // E17 - NÂº do Documento / InscriÃ§Ã£o Estadual (ObrigatÃ³rio)
    E17: z
      .string({ required_error: "NÂº do documento Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Informe o nÃºmero do documento." }),

    // E18 - Data de EmissÃ£o Docum. / Data da InscriÃ§Ã£o (Opcional, date <= hoje)
    E18: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || validateDate(val),
        { message: "Data invÃ¡lida ou futura." }
      ),

    // E20 - Tipo de Documento (ObrigatÃ³rio, lista: visaoDOC)
    E20: z
      .string({ required_error: "Tipo de documento Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Selecione uma das opÃ§Ãµes listadas na cÃ©lula." }),

    // E21 - Ã“rgÃ£o Emissor Docum. (ObrigatÃ³rio)
    E21: z
      .string({ required_error: "Ã“rgÃ£o emissor Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Informe o Ã³rgÃ£o emissor do documento." }),

    // E22 - UF Ã“rgÃ£o Emissor Docum. (ObrigatÃ³rio, lista: visaoUF)
    E22: z
      .string({ required_error: "UF do Ã³rgÃ£o emissor Ã© obrigatÃ³ria." })
      .trim()
      .min(1, { message: "Selecione uma das opÃ§Ãµes listadas na cÃ©lula." }),

    // E23 - TÃ­tulo Eleitoral (Opcional)
    E23: z.string().optional().or(z.literal("")),

    // E24 - Naturalidade (ObrigatÃ³rio, lista: VisaoNaturalidade)
    E24: z
      .string({ required_error: "Naturalidade Ã© obrigatÃ³ria." })
      .trim()
      .min(1, { message: "Selecione a naturalidade." }),

    // E25 - Sexo (ObrigatÃ³rio, lista: Masculino,Feminino)
    E25: z
      .string({ required_error: "Sexo Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Selecione o sexo (Masculino ou Feminino)." }),

    // E26 - Estado Civil (ObrigatÃ³rio, lista: visaoCIVIL)
    E26: z
      .string({ required_error: "Estado civil Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Selecione o estado civil." }),

    // E27 - Grau de InstruÃ§Ã£o (Opcional, lista: visaoESCOLA)
    E27: z.string().optional().or(z.literal("")),

    // E28 - ProfissÃ£o (Opcional, lista: visaoPROF)
    E28: z.string().optional().or(z.literal("")),

    // E29 - Atividade (ObrigatÃ³rio, lista: visaoATIV)
    E29: z
      .string({ required_error: "Atividade Ã© obrigatÃ³ria." })
      .trim()
      .min(1, { message: "Selecione a atividade." }),

    // E30 - Renda Mensal / Capital Social (ObrigatÃ³rio, decimal >= 0)
    E30: z
      .union([z.string(), z.number()])
      .refine(
        (val) => {
          if (val === "" || val === undefined || val === null) return false;
          const num = typeof val === "number" ? val : parseFloat(String(val).replace(/\./g, "").replace(",", "."));
          return !isNaN(num) && num >= 0;
        },
        { message: "Informe apenas valores numÃ©ricos maiores ou iguais a zero." }
      ),

    // E31 - BeneficiÃ¡rio PolÃ­ticas PÃºblicas (ObrigatÃ³rio, lista: Benef_Politica_Pub_Descr)
    E31: z
      .string({ required_error: "BeneficiÃ¡rio de polÃ­ticas pÃºblicas Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Selecione corretamente uma das opÃ§Ãµes!" }),

    // E32 - Nome do Pai (Opcional, <= 55 caracteres, validaÃ§Ã£o PF)
    E32: z
      .string()
      .max(55, { message: "O nome deve ter no mÃ¡ximo 55 caracteres." })
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || validateNomePF(val),
        { message: "O nome informado nÃ£o Ã© vÃ¡lido ou excede o limite de caracteres (mÃ¡ximo 55 caracteres)." }
      ),

    // E33 - Nome da MÃ£e (ObrigatÃ³rio, <= 55 caracteres, validaÃ§Ã£o PF)
    E33: z
      .string({ required_error: "Nome da mÃ£e Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "O nome da mÃ£e Ã© obrigatÃ³rio." })
      .max(55, { message: "O nome deve ter no mÃ¡ximo 55 caracteres." })
      .refine(validateNomePF, {
        message: "O nome informado nÃ£o Ã© vÃ¡lido ou excede o limite de caracteres (mÃ¡ximo 55 caracteres).",
      }),

    // E35 - Porte (ObrigatÃ³rio, lista: visaoPOR_PRONAF)
    E35: z
      .string({ required_error: "Porte Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Selecione o porte." }),

    // E36 - NÂº da DAP / CAF (ObrigatÃ³rio)
    E36: z
      .string({ required_error: "NÂº da DAP / CAF Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Informe o nÃºmero da DAP / CAF." }),

    // E37 - Capital Integralizado (Opcional)
    E37: z.union([z.string(), z.number()]).optional().or(z.literal("")),

    // ------------------------------------------------------------------------
    // Bloco B: EndereÃ§o da atividade
    // ------------------------------------------------------------------------

    // E44 - Tipo de Logradouro (ObrigatÃ³rio, lista: visaoTP_LOG)
    E44: z
      .string({ required_error: "Tipo de logradouro Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Selecione o tipo de logradouro." }),

    // E45 - EndereÃ§o (ObrigatÃ³rio, <= 45 caracteres, validaÃ§Ã£o ValidaNome J)
    E45: z
      .string({ required_error: "EndereÃ§o Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "O endereÃ§o Ã© obrigatÃ³rio." })
      .max(45, { message: "O endereÃ§o deve ter no mÃ¡ximo 45 caracteres." })
      .refine(
        (val) => validateNomeEndereco(val),
        { message: "EndereÃ§o invÃ¡lido ou com caracteres repetidos (mÃ¡ximo 45 caracteres)." }
      ),

    // E46 - NÂº (ObrigatÃ³rio, inteiro ou "S/N")
    E46: z
      .string({ required_error: "NÃºmero do endereÃ§o Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Informe o nÃºmero ou S/N." })
      .refine(validateNumeroEndereco, {
        message: 'Digite um nÃºmero ou "S/N" (sem as aspas) para caso de sem nÃºmero.',
      }),

    // E47 - Complemento (Opcional)
    E47: z.string().optional().or(z.literal("")),

    // E48 - Bairro (ObrigatÃ³rio)
    E48: z
      .string({ required_error: "Bairro Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Informe o bairro." }),

    // E49 - CEP (ObrigatÃ³rio, 8 dÃ­gitos)
    E49: z
      .union([z.string(), z.number()], { required_error: "CEP Ã© obrigatÃ³rio." })
      .refine(
        (val) => validateCEP(String(val)),
        { message: "CEP inconsistente." }
      ),

    // E50 - MunicÃ­pio (ObrigatÃ³rio, lista: visaoMUNI)
    E50: z
      .string({ required_error: "MunicÃ­pio Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Selecione o municÃ­pio." }),

    // E51 - DDD Telefone (Opcional, inteiro atÃ© 4 dÃ­gitos)
    E51: z
      .union([z.string(), z.number()])
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => {
          if (!val && val !== 0) return true;
          const s = String(val).trim();
          return /^\d{1,4}$/.test(s);
        },
        { message: "Somente caracteres numÃ©ricos permitir atÃ© 04 caracteres." }
      ),

    // E52 - NÂº Telefone (Opcional, inteiro atÃ© 9 dÃ­gitos)
    E52: z
      .union([z.string(), z.number()])
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => {
          if (!val && val !== 0) return true;
          const s = String(val).trim();
          return /^\d{1,9}$/.test(s);
        },
        { message: "Somente caracteres numÃ©ricos permitir atÃ© 09 caracteres." }
      ),

    // ------------------------------------------------------------------------
    // Bloco C: EndereÃ§o para correspondÃªncia
    // ------------------------------------------------------------------------

    // E58 - Tipo de Logradouro (ObrigatÃ³rio, lista: visaoTP_LOG)
    E58: z
      .string({ required_error: "Tipo de logradouro de correspondÃªncia Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Selecione o tipo de logradouro." }),

    // E59 - EndereÃ§o (ObrigatÃ³rio, <= 45 caracteres)
    E59: z
      .string({ required_error: "EndereÃ§o de correspondÃªncia Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "O endereÃ§o de correspondÃªncia Ã© obrigatÃ³rio." })
      .max(45, { message: "O endereÃ§o deve ter no mÃ¡ximo 45 caracteres." })
      .refine(
        (val) => validateNomeEndereco(val),
        { message: "EndereÃ§o invÃ¡lido ou com caracteres repetidos (mÃ¡ximo 45 caracteres)." }
      ),

    // E60 - NÂº (ObrigatÃ³rio, inteiro ou "S/N")
    E60: z
      .string({ required_error: "NÃºmero Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Informe o nÃºmero ou S/N." })
      .refine(validateNumeroEndereco, {
        message: 'Digite um nÃºmero ou "S/N" (sem as aspas) para caso de sem nÃºmero.',
      }),

    // E61 - Complemento (Opcional)
    E61: z.string().optional().or(z.literal("")),

    // E62 - Bairro (ObrigatÃ³rio)
    E62: z
      .string({ required_error: "Bairro de correspondÃªncia Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Informe o bairro." }),

    // E63 - CEP (ObrigatÃ³rio, 8 dÃ­gitos)
    E63: z
      .union([z.string(), z.number()], { required_error: "CEP de correspondÃªncia Ã© obrigatÃ³rio." })
      .refine(
        (val) => validateCEP(String(val)),
        { message: "CEP inconsistente." }
      ),

    // E64 - MunicÃ­pio (ObrigatÃ³rio, lista: visaoMUNI)
    E64: z
      .string({ required_error: "MunicÃ­pio de correspondÃªncia Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Selecione o municÃ­pio." }),

    // E65 - DDD Telefone (Opcional, atÃ© 4 dÃ­gitos)
    E65: z
      .union([z.string(), z.number()])
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => {
          if (!val && val !== 0) return true;
          const s = String(val).trim();
          return /^\d{1,4}$/.test(s);
        },
        { message: "Somente caracteres numÃ©ricos permitir atÃ© 04 caracteres." }
      ),

    // E66 - NÂº Telefone (Opcional, atÃ© 9 dÃ­gitos)
    E66: z
      .union([z.string(), z.number()])
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => {
          if (!val && val !== 0) return true;
          const s = String(val).trim();
          return /^\d{1,9}$/.test(s);
        },
        { message: "Somente caracteres numÃ©ricos permitir atÃ© 09 caracteres." }
      ),

    // ------------------------------------------------------------------------
    // Bloco D: ImÃ³vel da atividade
    // ------------------------------------------------------------------------

    // E73 - Tipo de Uso do imÃ³vel (ObrigatÃ³rio, lista: visaoPOSSE)
    E73: z
      .string({ required_error: "Tipo de uso do imÃ³vel Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "OpÃ§Ã£o invÃ¡lida. Selecione uma das opÃ§Ãµes listadas na cÃ©lula." }),

    // E74 - ProprietÃ¡rio do imÃ³vel (ObrigatÃ³rio, <= 55 caracteres)
    E74: z
      .string({ required_error: "ProprietÃ¡rio do imÃ³vel Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Informe o proprietÃ¡rio do imÃ³vel." })
      .max(55, { message: "O nome deve ter no mÃ¡ximo 55 caracteres." })
      .refine(
        (val) => validateNomeEndereco(val),
        { message: "O nome do proprietÃ¡rio informado nÃ£o Ã© vÃ¡lido (mÃ¡ximo 55 caracteres)." }
      ),

    // E75 - CPF/CNPJ do ProprietÃ¡rio (ObrigatÃ³rio)
    E75: z
      .string({ required_error: "CPF/CNPJ do proprietÃ¡rio Ã© obrigatÃ³rio." })
      .trim()
      .min(1, { message: "Informe o CPF ou CNPJ do proprietÃ¡rio." })
      .refine(validateCPFouCNPJ, { message: "CPF ou CNPJ do proprietÃ¡rio invÃ¡lido." }),

    // E77 - ItinerÃ¡rio (Opcional)
    E77: z.string().optional().or(z.literal("")),

    // ------------------------------------------------------------------------
    // Bloco E: CÃ´njuge / companheiro(a)
    // ------------------------------------------------------------------------

    // E82 - Nome CÃ´njuge (Opcional, <= 55 caracteres, se preenchido valida PF)
    E82: z
      .string()
      .max(55, { message: "O nome deve ter no mÃ¡ximo 55 caracteres." })
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || validateNomePF(val),
        { message: "O nome informado nÃ£o Ã© vÃ¡lido ou excede o limite de caracteres (mÃ¡ximo 55 caracteres)." }
      ),

    // E83 - C.P.F. CÃ´njuge/Comp. (Opcional, se preenchido valida CPF e difere de E15)
    E83: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || validateCPF(val),
        { message: "CPF do cÃ´njuge invÃ¡lido." }
      ),

    // E84 - Data de Nascimento CÃ´njuge (Opcional, date <= hoje)
    E84: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || validateDate(val),
        { message: "Data invÃ¡lida." }
      ),

    // E85 - NÂº do Documento CÃ´njuge (Opcional)
    E85: z.string().optional().or(z.literal("")),

    // E86 - Tipo de Documento CÃ´njuge (Opcional, lista: visaoDOC)
    E86: z.string().optional().or(z.literal("")),

    // E87 - Ã“rgÃ£o Emissor CÃ´njuge (Opcional)
    E87: z.string().optional().or(z.literal("")),

    // E88 - UF Ã“rgÃ£o Emissor CÃ´njuge (Opcional, lista: visaoUF)
    E88: z.string().optional().or(z.literal("")),

    // E89 - Data de EmissÃ£o CÃ´njuge (Opcional, date <= hoje)
    E89: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || validateDate(val),
        { message: "Data invÃ¡lida." }
      ),

    // E90 - Sexo CÃ´njuge (Opcional, lista: Masculino,Feminino)
    E90: z.string().optional().or(z.literal("")),

    // E91 - Estado Civil CÃ´njuge (Opcional, lista: visaoCIVIL)
    E91: z.string().optional().or(z.literal("")),

    // E92 - Grau de InstruÃ§Ã£o CÃ´njuge (Opcional, lista: visaoESCOLA)
    E92: z.string().optional().or(z.literal("")),

    // E93 - ProfissÃ£o CÃ´njuge (Opcional, lista: visaoPROF)
    E93: z.string().optional().or(z.literal("")),

    // E94 - Renda Mensal CÃ´njuge (Opcional, decimal >= 0)
    E94: z
      .union([z.string(), z.number()])
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => {
          if (!val && val !== 0) return true;
          const num = typeof val === "number" ? val : parseFloat(String(val).replace(/\./g, "").replace(",", "."));
          return !isNaN(num) && num >= 0;
        },
        { message: "Valor invÃ¡lido." }
      ),

    // E95 - Naturalidade CÃ´njuge (Opcional, lista: VisaoNaturalidade)
    E95: z.string().optional().or(z.literal("")),

    // E96 - Nome do Pai CÃ´njuge (Opcional, <= 55 caracteres, valida PF)
    E96: z
      .string()
      .max(55, { message: "O nome deve ter no mÃ¡ximo 55 caracteres." })
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || validateNomePF(val),
        { message: "O nome informado nÃ£o Ã© vÃ¡lido ou excede o limite de caracteres (mÃ¡ximo 55 caracteres)." }
      ),

    // E97 - Nome da MÃ£e CÃ´njuge (Opcional, <= 55 caracteres, valida PF)
    E97: z
      .string()
      .max(55, { message: "O nome deve ter no mÃ¡ximo 55 caracteres." })
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || validateNomePF(val),
        { message: "O nome informado nÃ£o Ã© vÃ¡lido ou excede o limite de caracteres (mÃ¡ximo 55 caracteres)." }
      ),

    // ------------------------------------------------------------------------
    // Bloco F: SÃ³cios / participaÃ§Ãµes (atÃ© 5)
    // ------------------------------------------------------------------------

    // SÃ³cio 1
    E106: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || validateCPFouCNPJ(val), { message: "CPF / CNPJ do sÃ³cio 1 invÃ¡lido." }),
    E107: z.string().max(55, { message: "MÃ¡ximo de 55 caracteres." }).optional().or(z.literal("")),
    E108: z.union([z.string(), z.number()]).optional().or(z.literal("")),
    E109: z.string().optional().or(z.literal("")),

    // SÃ³cio 2
    E113: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || validateCPFouCNPJ(val), { message: "CPF / CNPJ do sÃ³cio 2 invÃ¡lido." }),
    E114: z.string().max(55, { message: "MÃ¡ximo de 55 caracteres." }).optional().or(z.literal("")),
    E115: z.union([z.string(), z.number()]).optional().or(z.literal("")),
    E116: z.string().optional().or(z.literal("")),

    // SÃ³cio 3
    E120: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || validateCPFouCNPJ(val), { message: "CPF / CNPJ do sÃ³cio 3 invÃ¡lido." }),
    E121: z.string().max(55, { message: "MÃ¡ximo de 55 caracteres." }).optional().or(z.literal("")),
    E122: z.union([z.string(), z.number()]).optional().or(z.literal("")),
    E123: z.string().optional().or(z.literal("")),

    // SÃ³cio 4
    E127: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || validateCPFouCNPJ(val), { message: "CPF / CNPJ do sÃ³cio 4 invÃ¡lido." }),
    E128: z.string().max(55, { message: "MÃ¡ximo de 55 caracteres." }).optional().or(z.literal("")),
    E129: z.union([z.string(), z.number()]).optional().or(z.literal("")),
    E130: z.string().optional().or(z.literal("")),

    // SÃ³cio 5
    E134: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || validateCPFouCNPJ(val), { message: "CPF / CNPJ do sÃ³cio 5 invÃ¡lido." }),
    E135: z.string().max(55, { message: "MÃ¡ximo de 55 caracteres." }).optional().or(z.literal("")),
    E136: z.union([z.string(), z.number()]).optional().or(z.literal("")),
    E137: z.string().optional().or(z.literal("")),
  })
  // --------------------------------------------------------------------------
  // Refinamentos cruzados (regras de validaÃ§Ã£o do Spec seÃ§Ã£o 6 e VBA)
  // --------------------------------------------------------------------------
  .refine(
    (data) => {
      // ValidaÃ§Ã£o de E15 dependendo do tipo de cliente (PF ou PJ)
      if (data.E12 === "Pessoa JurÃ­dica") {
        return validateCNPJ(data.E15);
      }
      return validateCPF(data.E15);
    },
    {
      message: "CPF invÃ¡lido para Pessoa FÃ­sica ou CNPJ invÃ¡lido para Pessoa JurÃ­dica.",
      path: ["E15"],
    }
  )
  .refine(
    (data) => {
      // CPF do cÃ´njuge nÃ£o pode ser igual ao do titular
      if (!data.E83 || !data.E83.trim()) return true;
      const cleanTitular = data.E15.replace(/\D/g, "");
      const cleanConjuge = data.E83.replace(/\D/g, "");
      return cleanTitular !== cleanConjuge;
    },
    {
      message: "O CPF do cÃ´njuge nÃ£o pode ser igual ao CPF do cliente titular.",
      path: ["E83"],
    }
  )
  .refine(
    (data) => {
      // Data de EmissÃ£o >= Data de Nascimento (se ambas informadas)
      if (!data.E16 || !data.E18) return true;
      const dn = parseDateString(data.E16);
      const de = parseDateString(data.E18);
      if (!dn || !de) return true;
      return de.getTime() >= dn.getTime();
    },
    {
      message: "A Data de EmissÃ£o do documento deve ser posterior ou igual Ã  Data de Nascimento.",
      path: ["E18"],
    }
  )
  .refine(
    (data) => {
      // CÃ´njuge: Data de EmissÃ£o >= Data de Nascimento (se ambas informadas)
      if (!data.E84 || !data.E89) return true;
      const dn = parseDateString(data.E84);
      const de = parseDateString(data.E89);
      if (!dn || !de) return true;
      return de.getTime() >= dn.getTime();
    },
    {
      message: "A Data de EmissÃ£o do documento do cÃ´njuge deve ser posterior ou igual Ã  Data de Nascimento.",
      path: ["E89"],
    }
  );

export type ClienteFormData = z.infer<typeof clienteSchema>;

/**
 * Mapa descritivo de rÃ³tulos por cÃ©lula para a aba Cliente
 */
export const clienteFieldLabels: Record<string, string> = {
  E12: "Tipo Cliente",
  E13: "Nome",
  E14: "Apelido",
  E15: "C.P.F.",
  E16: "Data de Nascimento",
  E17: "NÂº do Documento",
  E18: "Data de EmissÃ£o Docum.",
  E20: "Tipo de Documento",
  E21: "Ã“rgÃ£o Emissor Docum.",
  E22: "UF Ã“rgÃ£o Emissor Docum.",
  E23: "TÃ­tulo Eleitoral",
  E24: "Naturalidade",
  E25: "Sexo",
  E26: "Estado Civil",
  E27: "Grau de InstruÃ§Ã£o",
  E28: "ProfissÃ£o",
  E29: "Atividade",
  E30: "Renda Mensal",
  E31: "BeneficiÃ¡rio PolÃ­ticas PÃºblicas",
  E32: "Nome do Pai",
  E33: "Nome da MÃ£e",
  E35: "Porte",
  E36: "NÂº da DAP",
  E37: "Capital Integralizado",
  E44: "Tipo de Logradouro",
  E45: "EndereÃ§o",
  E46: "NÂº",
  E47: "Complemento",
  E48: "Bairro",
  E49: "CEP",
  E50: "MunicÃ­pio",
  E51: "DDD Telefone",
  E52: "NÂº Telefone",
  E58: "Tipo de Logradouro (CorrespondÃªncia)",
  E59: "EndereÃ§o (CorrespondÃªncia)",
  E60: "NÂº (CorrespondÃªncia)",
  E61: "Complemento (CorrespondÃªncia)",
  E62: "Bairro (CorrespondÃªncia)",
  E63: "CEP (CorrespondÃªncia)",
  E64: "MunicÃ­pio (CorrespondÃªncia)",
  E65: "DDD Telefone (CorrespondÃªncia)",
  E66: "NÂº Telefone (CorrespondÃªncia)",
  E73: "Tipo de Uso do imÃ³vel",
  E74: "ProprietÃ¡rio do imÃ³vel",
  E75: "CPF/CNPJ do ProprietÃ¡rio",
  E77: "ItinerÃ¡rio",
  E82: "Nome (CÃ´njuge)",
  E83: "C.P.F. CÃ´njuge/Comp.",
  E84: "Data de Nascimento (CÃ´njuge)",
  E85: "NÂº do Documento (CÃ´njuge)",
  E86: "Tipo de Documento (CÃ´njuge)",
  E87: "Ã“rgÃ£o Emissor (CÃ´njuge)",
  E88: "UF Ã“rgÃ£o Emissor (CÃ´njuge)",
  E89: "Data de EmissÃ£o (CÃ´njuge)",
  E90: "Sexo (CÃ´njuge)",
  E91: "Estado Civil (CÃ´njuge)",
  E92: "Grau de InstruÃ§Ã£o (CÃ´njuge)",
  E93: "ProfissÃ£o (CÃ´njuge)",
  E94: "Renda Mensal (CÃ´njuge)",
  E95: "Naturalidade (CÃ´njuge)",
  E96: "Nome do Pai (CÃ´njuge)",
  E97: "Nome da MÃ£e (CÃ´njuge)",
  E106: "CPF / CNPJ (SÃ³cio 1)",
  E107: "Nome / RazÃ£o Social (SÃ³cio 1)",
  E108: "ParticipaÃ§Ã£o (%) (SÃ³cio 1)",
  E109: "Representa a Empresa? (S/N) (SÃ³cio 1)",
  E113: "CPF / CNPJ (SÃ³cio 2)",
  E114: "Nome / RazÃ£o Social (SÃ³cio 2)",
  E115: "ParticipaÃ§Ã£o (%) (SÃ³cio 2)",
  E116: "Representa a Empresa? (S/N) (SÃ³cio 2)",
  E120: "CPF / CNPJ (SÃ³cio 3)",
  E121: "Nome / RazÃ£o Social (SÃ³cio 3)",
  E122: "ParticipaÃ§Ã£o (%) (SÃ³cio 3)",
  E123: "Representa a Empresa? (S/N) (SÃ³cio 3)",
  E127: "CPF / CNPJ (SÃ³cio 4)",
  E128: "Nome / RazÃ£o Social (SÃ³cio 4)",
  E129: "ParticipaÃ§Ã£o (%) (SÃ³cio 4)",
  E130: "Representa a Empresa? (S/N) (SÃ³cio 4)",
  E134: "CPF / CNPJ (SÃ³cio 5)",
  E135: "Nome / RazÃ£o Social (SÃ³cio 5)",
  E136: "ParticipaÃ§Ã£o (%) (SÃ³cio 5)",
  E137: "Representa a Empresa? (S/N) (SÃ³cio 5)",
};
