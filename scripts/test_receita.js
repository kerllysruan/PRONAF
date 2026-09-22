async function findConsultar() {
  const chunks = [
    'chunk-AATM7B4R.js', 'chunk-44RK3X5P.js',
    'chunk-HRHJGXSL.js', 'chunk-67TEWLEX.js',
    'chunk-QTOOOGJX.js', 'chunk-3ENMYILF.js',
    'chunk-TWZW5B45.js', 'chunk-QM2TVCM6.js',
    'chunk-TSPJ6HIY.js', 'chunk-HUWAJ2OX.js',
    'chunk-DC2HEZY6.js', 'chunk-2SYRX6T7.js',
    'chunk-FJWYTVAH.js', 'chunk-UNWKMXOB.js',
    'chunk-HCP7GHEO.js', 'chunk-2QVTYQIZ.js',
    'chunk-A2LRZAR2.js', 'chunk-P6SVUKJR.js',
    'chunk-4GGAF32I.js', 'chunk-RRLASVS6.js', 'chunk-VF2SLQQO.js'
  ];
  for (const c of chunks) {
    const res = await fetch('https://servicos.receitafederal.gov.br/servico/certidoes/' + c);
    const text = await res.text();
    if (text.includes('Consultar') || text.includes('consultar') || text.includes('SegundaVia') || text.includes('segundaVia')) {
      if (text.includes('criarBlobUrl') || text.includes('t.pdf') || text.includes('.pdf') || text.includes('download')) {
        console.log('Match in chunk:', c);
        const idx = text.indexOf('criarBlobUrl');
        if (idx !== -1) {
          console.log('criarBlobUrl context in', c, ':', text.substring(idx - 100, idx + 300));
        }
      }
    }
  }
}

findConsultar().catch(console.error);








