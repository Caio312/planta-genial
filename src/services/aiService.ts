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
    const { totalArea, lotWidth, lotDepth, bedrooms, suites, bathrooms, livingStyle, additionalSpaces, architecturalStyle, drawingStyle } = request;
    
    let prompt = `Crie uma planta baixa arquitetônica profissional e detalhada com as seguintes especificações:

INFORMAÇÕES BÁSICAS:
- Área total: ${totalArea}m²
- Terreno: ${lotWidth}m × ${lotDepth}m
- Estilo: ${architecturalStyle}
- Tipo de desenho: ${drawingStyle}

PROGRAMA ARQUITETÔNICO:
- ${bedrooms} quartos (${suites} suítes)
- ${bathrooms} banheiros sociais
- Área social: ${livingStyle === 'integrated' ? 'conceito aberto (sala/cozinha integradas)' : 'ambientes separados'}`;

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
- Altura de paredes 2.70m
- Telhado simples
- Vegetação externa básica
- Sombras realistas`;
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

  async generateFloorPlan(request: FloorPlanRequest): Promise<AIResponse> {
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development') {
      // Mock response for development
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
      
      return {
        success: true,
        imageUrl: '/placeholder-floorplan.jpg', // You can add a placeholder image
        model: 'mock-ai',
        generationTime: 2000
      };
    }

    try {
      const prompt = this.generatePrompt(request);
      const startTime = Date.now();

      // For production, you would need to set up a backend API endpoint
      // that securely handles the OpenAI API key
      const response = await fetch('/api/generate-floorplan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: 'dall-e-3',
          size: '1792x1024',
          quality: 'hd',
          style: 'natural'
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const generationTime = Date.now() - startTime;

      return {
        success: true,
        imageUrl: data.data[0].url,
        model: 'dall-e-3',
        generationTime
      };
    } catch (error) {
      console.error('AI Generation Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na geração'
      };
    }
  }
}

export const aiService = new AIService();