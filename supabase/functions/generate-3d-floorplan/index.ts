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
    const { prompt, referenceImageUrl, quality = 'pro' } = await req.json();
    
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

    // 3D usa Nano Banana Pro por padrão (melhor qualidade arquitetônica)
    const model = quality === 'pro'
      ? 'google/gemini-3-pro-image-preview'
      : 'google/gemini-3.1-flash-image-preview';

    console.log(`Gerando vista 3D isométrica com ${model}...`);

    const enhancedPrompt = `${prompt}

ESPECIFICAÇÕES PARA VISTA 3D ISOMÉTRICA REALISTA:
- Vista isométrica/axonométrica em ângulo de 45°, com paredes externas removidas (cutaway)
- Pé direito de 2.50 metros em todos os ambientes
- Mostrar mobiliário básico em cada cômodo (camas, sofá, mesa, fogão, vasos sanitários)
- Telhado estilo brasileiro com telhas cerâmicas
- Texturas realistas: pisos diferenciados por ambiente, paredes em cor clara
- Iluminação natural suave entrando pelas janelas
- Sombras suaves e realistas
- Vegetação paisagística externa (jardim, árvores)
- Calçada e elementos externos
- Renderização arquitetônica profissional, alta qualidade
- ${referenceImageUrl ? 'IMPORTANTE: Use a planta baixa 2D fornecida como referência exata para o layout dos cômodos' : ''}`;

    const userContent: any = referenceImageUrl
      ? [
          { type: 'text', text: enhancedPrompt },
          { type: 'image_url', image_url: { url: referenceImageUrl } }
        ]
      : enhancedPrompt;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: userContent }],
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
          JSON.stringify({ error: 'Créditos de IA esgotados. Adicione créditos no workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Erro da API de IA: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error('Resposta da API:', JSON.stringify(data).slice(0, 500));
      throw new Error('Nenhuma imagem 3D foi gerada');
    }

    console.log('Vista 3D gerada com sucesso');

    return new Response(
      JSON.stringify({ success: true, imageUrl, model }),
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
