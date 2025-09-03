import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface FloorPlanRequest {
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

interface FloorPlanAIGeneratorProps {
  formData: FloorPlanRequest;
  onImageGenerated: (imageUrl: string) => void;
}

export const FloorPlanAIGenerator = ({ formData, onImageGenerated }: FloorPlanAIGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateFloorPlan = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      toast.info('Iniciando geração da planta baixa...', {
        description: 'Isso pode levar até 60 segundos'
      });

      // Mock generation for now
      await new Promise(resolve => setTimeout(resolve, 3000));
      const mockImageUrl = '/placeholder-floorplan.jpg';
      
      setGeneratedImage(mockImageUrl);
      onImageGenerated(mockImageUrl);
      toast.success('Planta baixa gerada com sucesso!');
    } catch (err) {
      const errorMessage = 'Erro na geração da planta baixa';
      setError(errorMessage);
      toast.error('Erro na geração', { description: errorMessage });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-primary" />
            Geração com IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!generatedImage && !isGenerating && (
            <Button 
              onClick={generateFloorPlan}
              className="w-full btn-primary"
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Gerar Planta Baixa com IA
            </Button>
          )}

          {isGenerating && (
            <div className="space-y-4">
              <Button disabled className="w-full" size="lg">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Gerando sua planta baixa...
              </Button>
              <Skeleton height={200} className="rounded-xl" />
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-error-light border border-error rounded-xl"
            >
              <div className="flex items-center text-error">
                <AlertCircle className="w-5 h-5 mr-2" />
                <div>
                  <h4 className="font-medium">Erro na geração</h4>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          {generatedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <Card>
                <CardContent className="p-6">
                  <img 
                    src={generatedImage} 
                    alt="Planta baixa gerada" 
                    className="w-full rounded-xl border"
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};