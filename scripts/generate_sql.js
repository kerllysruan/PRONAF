import fs from "fs";
import { inversoesData } from "./seed_inversoes.js";

let sql = `TRUNCATE TABLE public.inversoes_referencia;\n\nINSERT INTO public.inversoes_referencia (codigo, categoria, subcategoria, item, nome_completo, grupo, unidade_padrao, valor_maximo, valor_minimo, precos_por_uf, ordem)\nVALUES\n`;

const values = inversoesData.map((item, idx) => {
  const codigo = item.codigo ? `'${item.codigo}'` : "NULL";
  const categoria = `'${item.categoria.replace(/'/g, "''")}'`;
  const subcategoria = item.subcategoria ? `'${item.subcategoria.replace(/'/g, "''")}'` : "NULL";
  const itemDesc = `'${item.item.replace(/'/g, "''")}'`;
  const nomeCompleto = `'${item.nome_completo.replace(/'/g, "''")}'`;
  const grupo = `'${(item.grupo || "Animais").replace(/'/g, "''")}'`;
  const unidade = `'${(item.unidade_padrao || "UNID").replace(/'/g, "''")}'`;
  const max = Number(item.valor_maximo) || 0;
  const min = item.valor_minimo ? Number(item.valor_minimo) : "NULL";
  const precos = `'${JSON.stringify(item.precos_por_uf || {})}'::jsonb`;
  const ordem = idx + 1;

  return `(${codigo}, ${categoria}, ${subcategoria}, ${itemDesc}, ${nomeCompleto}, ${grupo}, ${unidade}, ${max}, ${min}, ${precos}, ${ordem})`;
});

sql += values.join(",\n") + ";\n";

fs.writeFileSync("scripts/seed_inversoes.sql", sql, "utf8");
console.log(`Gerado scripts/seed_inversoes.sql com ${inversoesData.length} registros.`);
