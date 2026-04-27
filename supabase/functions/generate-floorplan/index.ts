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
    const { prompt, quality = 'fast' } = await req.json();
    
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

    // 'pro' usa Nano Banana Pro (melhor qualidade), 'fast' usa Nano Banana 2 (rápido + bom)
    const model = quality === 'pro'
      ? 'google/gemini-3-pro-image-preview'
      : 'google/gemini-3.1-flash-image-preview';

    console.log(`Gerando planta baixa 2D com ${model}...`);

    const enhancedPrompt = `${prompt}

REQUISITOS CRÍTICOS DA IMAGEM:
- Vista superior estritamente ortogonal (top-down 2D), NÃO use perspectiva nem isométrico
- Fundo branco puro, paredes em linhas pretas espessas (paredes externas mais grossas)
- Cotas (dimensões em metros) marcadas nas paredes externas e em ambientes principais
- Símbolos arquitetônicos NBR: portas com arco de abertura, janelas com linhas duplas
- Texto legível em português: nome do ambiente + área em m² (ex: "SALA 25.5 m²")
- Norte indicado com seta no canto superior direito
- Escala 1:100 indicada
- Estilo brasileiro contemporâneo minimalista
- Imagem nítida, alta resolução, qualidade técnica de prancha arquitetônica`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: enhancedPrompt }],
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
      throw new Error('Nenhuma imagem foi gerada');
    }

    console.log('Planta baixa 2D gerada com sucesso');

    return new Response(
      JSON.stringify({ success: true, imageUrl, model }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao gerar planta baixa'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
