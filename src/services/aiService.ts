export interface FloorPlanRequest {
  totalArea: number;
  lotWidth: number;
  lotDepth: number;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  livingStyle: 'integrated' | 'separated';
  additionalSpaces: string[];
  architecturalStyle: string;
  drawingStyle: 'technical_2d' | 'humanized_2d' | 'isometric_3d';
}

export interface AIResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  model?: string;
  generationTime?: number;
}

class AIService {
  private readonly baseUrl = 'https://api.openai.com/v1/images/generations';
  
  private generatePrompt(request: FloorPlanRequest): string {
    const { totalArea, lotWidth, lotDepth, bedrooms, suites, bathrooms, additionalSpaces, drawingStyle } = request;
    
    let prompt = `Crie uma planta baixa arquitetônica profissional e detalhada com as seguintes especificações:

INFORMAÇÕES BÁSICAS:
- Área total: ${totalArea}m²
- Terreno: ${lotWidth}m × ${lotDepth}m
- Estilo: Moderno minimalista com toque brasileiro contemporâneo
- Tipo de desenho: ${drawingStyle}

PROGRAMA ARQUITETÔNICO:
- ${bedrooms} quartos (${suites} suítes)
- ${bathrooms} banheiros sociais
- Área social: conceito aberto e integrado`;

    if (additionalSpaces.length > 0) {
      prompt += `\n- Espaços adicionais: ${additionalSpaces.join(', ')}`;
    }

    prompt += `

ESPECIFICAÇÕES TÉCNICAS:
- Vista superior (planta baixa)
- Fundo branco, linhas pretas precisas
- Cotas e dimensões visíveis
- Identificação de ambientes
- Orientação solar (Norte indicado)
- Escala 1:100`;

    switch (drawingStyle) {
      case 'technical_2d':
        prompt += `
- Sistema de cotas completo
- Eixos estruturais
- Espessura de paredes (15cm internas, 20cm externas)
- Representação técnica de portas e janelas com simbologia padrão NBR`;
        break;
      case 'humanized_2d':
        prompt += `
- Mobiliário detalhado
- Decoração básica
- Texturas de piso
- Plantas ornamentais
- Cores suaves para diferenciação de ambientes`;
        break;
      case 'isometric_3d':
        prompt += `
- Vista isométrica 3D
- Altura de paredes 2.50m (pé direito padrão brasileiro)
- Telhado simples estilo brasileiro
- Vegetação externa básica
- Sombras realistas e suaves`;
        break;
    }

    prompt += `

QUALIDADE:
- Resolução alta e nítida
- Proporções realistas e funcionais
- Distribuição otimizada dos espaços
- Circulação adequada entre ambientes
- Conformidade com normas básicas de acessibilidade`;

    return prompt;
  }

  async generate3D(request: FloorPlanRequest): Promise<AIResponse> {
    const request3D = { ...request, drawingStyle: 'isometric_3d' as const };
    
    try {
      const startTime = Date.now();
      const prompt = this.generatePrompt(request3D);
      
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('generate-3d-floorplan', {
        body: { prompt }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao chamar função de geração 3D');
      }

      if (!data.success || !data.imageUrl) {
        throw new Error(data.error || 'Erro ao gerar vista 3D');
      }

      const generationTime = Date.now() - startTime;

      return {
        success: true,
        imageUrl: data.imageUrl,
        model: data.model || 'google/gemini-2.5-flash-image-preview',
        generationTime
      };
    } catch (error) {
      console.error('3D Generation Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na geração 3D'
      };
    }
  }

  async generateFloorPlan(request: FloorPlanRequest): Promise<AIResponse> {
    try {
      const prompt = this.generatePrompt(request);
      const startTime = Date.now();

      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('generate-floorplan', {
        body: { prompt }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao chamar função de geração');
      }

      if (!data.success || !data.imageUrl) {
        throw new Error(data.error || 'Erro ao gerar planta baixa');
      }

      const generationTime = Date.now() - startTime;

      return {
        success: true,
        imageUrl: data.imageUrl,
        model: data.model || 'google/gemini-2.5-flash-image-preview',
        generationTime
      };
    } catch (error) {
      console.error('AI Generation Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar planta baixa'
      };
    }
  }
}

export const aiService = new AIService();