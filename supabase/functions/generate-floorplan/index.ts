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

REQUISITOS CRÍTICOS — PRANCHA ARQUITETÔNICA NBR 6492 / NBR 15575:
- VISTA: estritamente top-down ortogonal (planta baixa 2D), SEM perspectiva, SEM isométrico, SEM sombras realistas
- DESENHO TÉCNICO: fundo branco puro, paredes pretas (externas espessas ~25cm, internas ~15cm), hachuras de parede em corte
- COTAS em metros nas paredes externas e internas principais (ex: "3.20", "4.15")
- SÍMBOLOS NBR: portas com arco de abertura de 90°, janelas com linhas duplas paralelas, basculantes com tracejado diagonal
- MOBILIÁRIO esquemático em planta: camas (com travesseiros), sofá em L, mesa de jantar, fogão, pia, vaso sanitário, box de banheiro
- TEXTO em PORTUGUÊS legível: "SALA 18.5m²", "QUARTO 9.0m²", "BANHEIRO 3.2m²", "COZINHA 8.0m²"
- Norte com seta no canto superior direito; escala "ESC 1:100" no canto inferior
- Áreas mínimas NBR 15575: dormitórios ≥ 8m², sala ≥ 10m², cozinha ≥ 4m², banheiro ≥ 2m²
- Largura mínima de circulação: 0,90m
- Pé-direito de referência: 2,50m
- ESTILO: prancha técnica brasileira contemporânea minimalista, traços limpos e precisos
- Imagem nítida em alta resolução, proporção respeitando o terreno informado`;

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
