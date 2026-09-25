/**
 * Importador dinâmico seguro contra erros de cache/deploy (stale chunk hash 404).
 * Quando um novo deploy ocorre, chunks com hashes antigos deixam de existir no servidor.
 * Se o navegador tentar buscar um hash antigo, esta função recarrega a página automaticamente
 * para carregar a versão mais recente dos scripts.
 */
export async function safeDynamicImport<T>(importFn: () => Promise<T>): Promise<T> {
  try {
    return await importFn();
  } catch (error: any) {
    const errorMsg = String(error?.message || error || "");
    const isChunkError =
      errorMsg.includes("Failed to fetch dynamically imported module") ||
      errorMsg.includes("dynamically imported module") ||
      errorMsg.includes("Loading chunk") ||
      errorMsg.includes("error loading dynamically imported module") ||
      error?.name === "ChunkLoadError";

    if (isChunkError && typeof window !== "undefined") {
      console.warn("Chunk desatualizado detectado pós-deploy. Recarregando a página...", error);
      
      const lastReload = sessionStorage.getItem("last_chunk_reload");
      const now = Date.now();
      
      // Evita recarregamento em loop (mínimo de 10s entre reloads)
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem("last_chunk_reload", String(now));
        window.location.reload();
        // Retorna promessa pendente para evitar execução do catch posterior durante o reload
        return new Promise<T>(() => {});
      }
    }
    throw error;
  }
}
