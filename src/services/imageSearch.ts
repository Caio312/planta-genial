const UNSPLASH_API = 'https://api.unsplash.com';

export async function searchFloorPlanReferences(query: string) {
  const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  if (!key) {
    console.warn('VITE_UNSPLASH_ACCESS_KEY não encontrada. searchFloorPlanReferences retornará lista vazia.');
    return [];
  }

  try {
    const resp = await fetch(
      `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&per_page=9`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );

    if (resp.status === 401) {
      console.warn('Unsplash API: 401 Unauthorized — verifique VITE_UNSPLASH_ACCESS_KEY (chave inválida).');
      return [];
    }
    if (!resp.ok) {
      console.warn('Unsplash API respondeu com status', resp.status);
      return [];
    }

    const data = await resp.json();
    return (data.results || []).map((img: any) => ({
      id: img.id,
      url: img.urls?.regular || img.urls?.small,
      title: img.description || img.alt_description || 'Planta Baixa',
      source: 'Unsplash'
    }));
  } catch (err) {
    console.error('Erro ao buscar imagens: Error:', err);
    return [];
  }
}