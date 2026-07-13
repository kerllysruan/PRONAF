import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://ailmvtqnrltepobtwbhq.supabase.co',
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
);

async function check() {
  const { data: proposal, error: propErr } = await supabase
    .from('stock_proposals')
    .select('id, producer_name, localizacao, municipio, inversoes')
    .ilike('producer_name', '%Delmiro%')
    .maybeSingle();

  if (propErr) {
    console.error('Prop Error:', propErr);
    return;
  }
  if (!proposal) {
    console.log('Proposal not found');
    return;
  }

  console.log('Proposal:', proposal);

  const { data: tokens, error: tokenErr } = await supabase
    .from('documentation_tokens')
    .select('id')
    .eq('stock_proposal_id', proposal.id);

  if (tokenErr) {
    console.error('Token Error:', tokenErr);
    return;
  }

  console.log('Tokens:', tokens);

  if (tokens && tokens.length > 0) {
    const tokenIds = tokens.map(t => t.id);
    const { data: files, error: fileErr } = await supabase
      .from('documentation_files')
      .select('id, document_type, file_path, status, ged_id')
      .in('token_id', tokenIds);

    if (fileErr) {
      console.error('File Error:', fileErr);
      return;
    }
    console.log('Files:');
    console.table(files);
  }
}

check();
