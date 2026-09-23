import fs from "fs";
import { Buffer } from "buffer";
import officeCrypto from "officecrypto-tool";
import * as XLSX from "xlsx";

function normalizeText(str) {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function parseMoney(val) {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return val;
  const clean = String(val)
    .replace(/R\$\s?/gi, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

function mapUnidade(raw) {
  const norm = normalizeText(raw);
  if (norm.startsWith("CAB")) return "CAB";
  if (norm.startsWith("HECT") || norm === "HA") return "HECT";
  if (norm.startsWith("KG") || norm.startsWith("QUIL")) return "KG";
  if (norm.startsWith("SC") || norm.startsWith("SAC")) return "SC";
  if (norm.startsWith("CX") || norm.startsWith("CAIX")) return "CX";
  if (norm === "T" || norm.startsWith("TON")) return "T";
  if (norm === "M") return "M";
  if (norm === "M2" || norm === "M²") return "M²";
  if (norm === "M3" || norm === "M³") return "M³";
  if (norm.startsWith("DZ") || norm.startsWith("DUZ")) return "DZ";
  if (norm.startsWith("LT") || norm.startsWith("LITR")) return "LT";
  if (norm.startsWith("DIA") || norm.startsWith("D/H")) return "DIA";
  return "UNID";
}

async function parseExcelInversoes(buffer) {
  let fileBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  
  // 1. Check if encrypted
  let isEncrypted = false;
  try {
    isEncrypted = await officeCrypto.isEncrypted(fileBuffer);
  } catch (e) {
    isEncrypted = false;
  }

  let decryptedBuffer = fileBuffer;
  if (isEncrypted) {
    console.log("File is encrypted, trying passwords...");
    const passwords = ["senhasBNxI", "senhasBN", "senhasBNXI", "senhaBNxI", "senhaBNXI", "senhasbnxi", "senhasBNx1", "VelvetSweatshop"];
    let success = false;
    for (const pwd of passwords) {
      try {
        decryptedBuffer = await officeCrypto.decrypt(fileBuffer, { password: pwd });
        console.log(`Successfully decrypted with password: "${pwd}"!`);
        success = true;
        break;
      } catch (err) {
        // try next
      }
    }
    if (!success) {
      return {
        success: false,
        error: "Arquivo protegido com senha desconhecida. Tentou senhasBNxI e variações.",
      };
    }
  }

  // 2. Read workbook
  const wb = XLSX.read(decryptedBuffer, { type: "buffer" });
  console.log("Sheet names:", wb.SheetNames);

  // 3. Check for SEAP format (BdPRONAF_C)
  if (wb.SheetNames.includes("BdPRONAF_C")) {
    console.log("Detected SEAP / PRONAF_A format!");
    const sheet = wb.Sheets["BdPRONAF_C"];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Inversões start at row 122 (index 121)
    // Row 121 (index 120) has headers:
    // col 22: Discriminação, col 24: Quant., col 25: Unid., col 27: Unitário
    const items = [];
    for (let r = 121; r < rows.length; r++) {
      const row = rows[r] || [];
      const desc = row[22];
      if (!desc || String(desc).trim() === "") {
        // If empty or past inversões block (check row 160)
        if (r > 130) break;
        continue;
      }
      const nome = String(desc).trim();
      const quant = Math.max(1, parseInt(row[24]) || 1);
      const unid = mapUnidade(row[25]);
      const valorUnit = parseMoney(row[27]);
      const valorTotal = quant * valorUnit;

      items.push({
        quant,
        unid,
        nome: nome.toUpperCase(),
        valor_unitario: valorUnit,
        valor: valorTotal,
      });
    }

    // Check assessoria cost
    let custoAssessoria = 0;
    // Assessoria is typically 5% of total inversões if tipo custo assessoria is enabled
    // Or row 121 col 68 indicates 'Tipo Custo Assessoria' = 1
    const totalItens = items.reduce((acc, i) => acc + i.valor, 0);
    const tipoAssessoria = rows[121] ? rows[121][68] : null;
    if (tipoAssessoria === 1 || tipoAssessoria === "1") {
      custoAssessoria = Math.round(totalItens * 0.05 * 100) / 100;
    }

    return {
      success: true,
      formatDetected: "SEAP / PRONAF-A",
      items,
      custoAssessoria,
      totalItens,
      totalGeral: totalItens + custoAssessoria,
    };
  }

  // 4. Standard tabular search across all sheets
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Find header row
    for (let r = 0; r < Math.min(30, rows.length); r++) {
      const row = rows[r] || [];
      const colMap = {};
      row.forEach((cell, cIdx) => {
        const norm = normalizeText(cell);
        if (norm.includes("ITEM") || norm.includes("DESCRIC") || norm.includes("DISCRIMIN") || norm.includes("ESPECIFIC") || norm.includes("INVERS")) {
          if (!colMap.desc) colMap.desc = cIdx;
        } else if (norm.includes("QUANT") || norm === "QTD" || norm === "QTE") {
          colMap.quant = cIdx;
        } else if (norm.includes("UNID") || norm === "UND" || norm === "UN") {
          colMap.unid = cIdx;
        } else if (norm.includes("UNIT") || norm.includes("VLR. UNIT") || norm.includes("PRECO UNIT")) {
          colMap.unit = cIdx;
        } else if (norm.includes("TOTAL") || norm.includes("VALOR") || norm.includes("SUBTOTAL")) {
          colMap.total = cIdx;
        }
      });

      if (colMap.desc !== undefined && (colMap.total !== undefined || colMap.unit !== undefined)) {
        console.log(`Found tabular header in '${sheetName}' row ${r + 1}:`, colMap);
        const items = [];
        let custoAssessoria = 0;

        for (let rowIdx = r + 1; rowIdx < rows.length; rowIdx++) {
          const itemRow = rows[rowIdx] || [];
          const descRaw = itemRow[colMap.desc];
          if (!descRaw || String(descRaw).trim() === "") continue;

          const desc = String(descRaw).trim();
          const normDesc = normalizeText(desc);

          if (normDesc.startsWith("TOTAL") || normDesc.startsWith("SOMA")) break;

          const quant = colMap.quant !== undefined ? Math.max(1, parseInt(itemRow[colMap.quant]) || 1) : 1;
          const unid = colMap.unid !== undefined ? mapUnidade(itemRow[colMap.unid]) : "UNID";
          const unitRaw = colMap.unit !== undefined ? parseMoney(itemRow[colMap.unit]) : 0;
          const totalRaw = colMap.total !== undefined ? parseMoney(itemRow[colMap.total]) : 0;

          const valorUnit = unitRaw > 0 ? unitRaw : (totalRaw > 0 ? Math.round((totalRaw / quant) * 100) / 100 : 0);
          const valorTotal = totalRaw > 0 ? totalRaw : (valorUnit > 0 ? quant * valorUnit : 0);

          if (normDesc.includes("ASSESSORIA") || normDesc.includes("ELABORACAO DO PROJETO")) {
            custoAssessoria = valorTotal;
            continue;
          }

          if (valorTotal > 0 || valorUnit > 0) {
            items.push({
              quant,
              unid,
              nome: desc.toUpperCase(),
              valor_unitario: valorUnit,
              valor: valorTotal,
            });
          }
        }

        if (items.length > 0) {
          const totalItens = items.reduce((acc, i) => acc + i.valor, 0);
          return {
            success: true,
            formatDetected: `Planilha Tabular (${sheetName})`,
            items,
            custoAssessoria,
            totalItens,
            totalGeral: totalItens + custoAssessoria,
          };
        }
      }
    }
  }

  return {
    success: false,
    error: "Não foi possível identificar colunas de inversões na planilha.",
  };
}

async function run() {
  const filePath = "C:/Users/Windows Lite BR/Downloads/16_PLANO_PROPOSTA_OU_PROJETO_SEAP_741039034.pronaf_a2";
  const buf = fs.readFileSync(filePath);
  const result = await parseExcelInversoes(buf);
  console.log("\n================ RESULT ================");
  console.log(JSON.stringify(result, null, 2));
}

run();
