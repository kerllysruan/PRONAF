import fs from 'fs';
import path from 'path';

// Read and parse .env manually
const envPath = path.resolve(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.substring(1, value.length - 1);
    env[key] = value;
  }
});

const supabaseUrl = env["VITE_SUPABASE_URL"];
const supabaseKey = env["VITE_SUPABASE_PUBLISHABLE_KEY"];

async function fetchSupabase(table, query = "") {
  const url = `${supabaseUrl}/rest/v1/${table}?${query}`;
  const response = await fetch(url, {
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`);
  }
  return await response.json();
}

async function run() {
  try {
    console.log("Checking recently modified documentation files...");
    const files = await fetchSupabase("documentation_files", "order=created_at.desc&limit=10");
    console.log("Last 10 records in documentation_files:");
    files.forEach(f => {
      console.log(`- ID: ${f.id} | Token: ${f.token_id} | Type: ${f.document_type} | Path: ${f.file_path} | Status: ${f.status} | CreatedAt: ${f.created_at}`);
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
