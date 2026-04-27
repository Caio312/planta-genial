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

VISTA 3D ISOMÉTRICA ARQUITETÔNICA REALISTA — DOLLHOUSE CUTAWAY:
- Vista isométrica em ângulo de 30°-45° (axonométrica), tipo "boneca/dollhouse" sem teto e com paredes externas rebaixadas para revelar todos os ambientes
- PÉ-DIREITO de exatamente 2,50 metros em todos os cômodos
- LAYOUT IDÊNTICO à planta baixa fornecida — respeite EXATAMENTE a posição, formato e proporção de cada cômodo (não invente, não rearranje)
- Mobiliário realista por ambiente: quartos (cama de casal/solteiro, criado-mudo, guarda-roupa), sala (sofá, TV, mesa de centro), cozinha (bancada, fogão, geladeira, pia), banheiro (vaso, pia, box), área de serviço (tanque, máquina)
- Materiais brasileiros: piso porcelanato claro na área social, piso laminado/cerâmico nos quartos, azulejo branco nos molhados
- Paredes externas em cor clara (branco/bege), esquadrias de alumínio escuro
- Telhado: representar contorno apenas (cutaway), com telhas cerâmicas brasileiras visíveis nas bordas
- Iluminação natural suave entrando pelas janelas, sombras realistas porém sutis
- Vegetação paisagística externa (gramado, arbustos, 1-2 árvores pequenas)
- Renderização tipo SketchUp/Lumion arquitetônico profissional, fundo branco/neutro
- Sem texto, sem cotas, sem números — apenas a renderização 3D
${referenceImageUrl ? '\n⚠️ CRÍTICO: A imagem em anexo é a planta baixa 2D oficial. Replique exatamente o mesmo layout, número e disposição dos cômodos no 3D.' : ''}`;

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
