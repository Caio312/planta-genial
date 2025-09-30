import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    console.log('Gerando visualização 3D isométrica...');

    // Prompt específico para 3D com ênfase em qualidade arquitetônica
    const enhancedPrompt = `${prompt}

ESPECIFICAÇÕES ADICIONAIS PARA VISTA 3D ISOMÉTRICA:
- Vista isométrica com perspectiva de 45°
- Pé direito de 2.50 metros em todos os ambientes
- Telhado estilo brasileiro com telhas cerâmicas aparentes
- Paredes externas com textura realista (reboco/pintura)
- Janelas com vidros refletivos e caixilhos definidos
- Portas com detalhamento realista
- Pisos internos com textura diferenciada por ambiente
- Iluminação natural simulada entrando pelas janelas
- Sombras suaves projetadas pela construção
- Vegetação paisagística externa (árvores, jardim)
- Calçada e elementos externos básicos
- Qualidade ultra-alta resolução para impressão`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Aguarde alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos em Settings -> Usage.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Erro da API de IA: ${response.status}`);
    }

    const data = await response.json();
    
    // Extrair a imagem gerada
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error('Resposta da API:', JSON.stringify(data));
      throw new Error('Nenhuma imagem 3D foi gerada');
    }

    console.log('Vista 3D isométrica gerada com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl,
        model: 'google/gemini-2.5-flash-image-preview'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao gerar vista 3D'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
