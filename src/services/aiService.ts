import { supabase } from '@/integrations/supabase/client';

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
  private generatePrompt(request: FloorPlanRequest): string {
    const { totalArea, lotWidth, lotDepth, bedrooms, suites, bathrooms, additionalSpaces } = request;

    return `Gere uma planta baixa arquitetônica residencial profissional:

DADOS:
- Área construída: ${totalArea}m²
- Terreno: ${lotWidth}m x ${lotDepth}m
- ${bedrooms} quartos (${suites} suíte${suites > 1 ? 's' : ''} com banheiro privativo)
- ${bathrooms} banheiros sociais
- Sala e cozinha integradas (conceito aberto)
- Área de serviço
${additionalSpaces.length > 0 ? `- Espaços adicionais: ${additionalSpaces.join(', ')}` : ''}

ESTILO: Minimalista contemporâneo brasileiro, layout funcional e otimizado, boa ventilação e iluminação natural cruzada.`;
  }

  async generateFloorPlan(request: FloorPlanRequest, quality: 'fast' | 'pro' = 'fast'): Promise<AIResponse> {
    try {
      const startTime = Date.now();
      const prompt = this.generatePrompt(request);

      const { data, error } = await supabase.functions.invoke('generate-floorplan', {
        body: { prompt, quality }
      });

      if (error) throw new Error(error.message || 'Erro ao chamar geração');
      if (!data?.success || !data.imageUrl) {
        throw new Error(data?.error || 'Erro ao gerar planta baixa');
      }

      return {
        success: true,
        imageUrl: data.imageUrl,
        model: data.model,
        generationTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('AI Generation Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar planta baixa'
      };
    }
  }

  async generate3D(request: FloorPlanRequest, referenceImageUrl?: string): Promise<AIResponse> {
    try {
      const startTime = Date.now();
      const prompt = this.generatePrompt({ ...request, drawingStyle: 'isometric_3d' });

      const { data, error } = await supabase.functions.invoke('generate-3d-floorplan', {
        body: { prompt, referenceImageUrl, quality: 'pro' }
      });

      if (error) throw new Error(error.message || 'Erro ao chamar geração 3D');
      if (!data?.success || !data.imageUrl) {
        throw new Error(data?.error || 'Erro ao gerar vista 3D');
      }

      return {
        success: true,
        imageUrl: data.imageUrl,
        model: data.model,
        generationTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('3D Generation Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na geração 3D'
      };
    }
  }
}

export const aiService = new AIService();
