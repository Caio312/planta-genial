import { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Eye, ZoomIn, ZoomOut, FileText, Box, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { aiService } from '@/services/aiService';

interface FloorPlanData {
  totalArea: number;
  lotWidth: number;
  lotDepth: number;
  bedrooms: number;
  bathrooms: number;
  hasGarage: boolean;
  hasBalcony: boolean;
  style: string;
}

interface Room {
  id: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  type: 'bedroom' | 'bathroom' | 'living' | 'kitchen' | 'garage' | 'balcony';
  windows?: Array<{ x: number; y: number; width: number; height: number; type: 'normal' | 'basculante'; sillHeight: number; }>;
  doors?: Array<{ x: number; y: number; width: number; height: number; }>;
}

interface FloorPlanViewerProps {
  data: FloorPlanData;
  onExportPDF: (aiImageUrl?: string) => void;
  onExportDWG: () => void;
}

export const FloorPlanViewer = ({ data, onExportPDF, onExportDWG }: FloorPlanViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [scale, setScale] = useState(20);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [view, setView] = useState<'schematic' | 'ai'>('schematic');
  const [image3D, setImage3D] = useState<string | null>(null);
  const [loading3D, setLoading3D] = useState(false);
  const [show3DDialog, setShow3DDialog] = useState(false);

  const offset = { x: 50, y: 50 };

  useEffect(() => {
    generateSchematic();
  }, [data, scale]);

  const generateSchematic = () => {
    const generatedRooms: Room[] = [];
    let currentX = 1;
    let currentY = 1;
    
    const livingWidth = Math.min(6, data.lotWidth - 2);
    const livingHeight = Math.min(4, data.lotDepth * 0.3);
    generatedRooms.push({
      id: 'living', name: 'Sala de Estar', width: livingWidth, height: livingHeight,
      x: currentX, y: currentY, type: 'living',
      windows: [{ x: 0, y: livingHeight / 2 - 0.6, width: 1.2, height: 1.2, type: 'normal', sillHeight: 1.0 }],
      doors: [{ x: livingWidth - 0.1, y: livingHeight / 2 - 0.4, width: 0.8, height: 2.1 }]
    });

    currentX += livingWidth + 0.15;
    const kitchenWidth = Math.min(3.5, data.lotWidth - currentX - 1);
    generatedRooms.push({
      id: 'kitchen', name: 'Cozinha', width: kitchenWidth, height: livingHeight,
      x: currentX, y: currentY, type: 'kitchen',
      windows: [{ x: kitchenWidth - 0.6, y: 0, width: 0.6, height: 0.6, type: 'basculante', sillHeight: 1.6 }]
    });

    currentY += livingHeight + 0.15;
    currentX = 1;
    const bedroomWidth = (data.lotWidth - 3 - 0.15) / data.bedrooms;
    for (let i = 0; i < data.bedrooms; i++) {
      const isMaster = i === 0;
      generatedRooms.push({
        id: `bedroom${i + 1}`, name: isMaster ? 'Quarto Master' : `Quarto ${i + 1}`,
        width: bedroomWidth, height: isMaster ? 4 : 3.5,
        x: currentX + i * (bedroomWidth + 0.15), y: currentY, type: 'bedroom',
        windows: [{ x: 0, y: 1, width: 1.0, height: 1.2, type: 'normal', sillHeight: 1.0 }]
      });
    }

    for (let i = 0; i < data.bathrooms; i++) {
      generatedRooms.push({
        id: `bathroom${i + 1}`, name: `Banheiro ${i === 0 ? 'Social' : i + 1}`,
        width: 2.5, height: 2.0,
        x: data.lotWidth - 3.5, y: currentY + i * 2.15, type: 'bathroom',
        windows: [{ x: 1.9, y: 0, width: 0.6, height: 0.6, type: 'basculante', sillHeight: 1.6 }]
      });
    }

    if (data.hasGarage) {
      generatedRooms.push({
        id: 'garage', name: 'Garagem', width: 3.5, height: 5.5,
        x: 1, y: data.lotDepth - 6.5, type: 'garage'
      });
    }

    setRooms(generatedRooms);
    requestAnimationFrame(() => drawFloorPlan(generatedRooms));
  };

  const drawFloorPlan = (roomsToDraw: Room[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '12px Inter';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e5e7eb';
    ctx.strokeRect(offset.x, offset.y, data.lotWidth * scale, data.lotDepth * scale);

    const fillColors: Record<string, string> = {
      bedroom: '#fef3c7', bathroom: '#dbeafe', living: '#d1fae5',
      kitchen: '#fce7f3', garage: '#f3f4f6', balcony: '#e0f2fe'
    };

    roomsToDraw.forEach(room => {
      const roomX = offset.x + room.x * scale;
      const roomY = offset.y + room.y * scale;
      const roomW = room.width * scale;
      const roomH = room.height * scale;

      ctx.fillStyle = fillColors[room.type] || '#f9fafb';
      ctx.fillRect(roomX, roomY, roomW, roomH);
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;
      ctx.strokeRect(roomX, roomY, roomW, roomH);

      ctx.fillStyle = '#374151';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(room.name, roomX + roomW / 2, roomY + roomH / 2 - 6);
      ctx.font = '10px Inter';
      ctx.fillText(`${room.width.toFixed(1)}m × ${room.height.toFixed(1)}m`, roomX + roomW / 2, roomY + roomH / 2 + 8);

      room.windows?.forEach(w => {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.strokeRect(roomX + w.x * scale, roomY + w.y * scale, w.width * scale, w.height * scale);
      });
    });

    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(`${data.lotWidth}m`, offset.x + (data.lotWidth * scale) / 2, offset.y - 10);
    ctx.save();
    ctx.translate(offset.x - 20, offset.y + (data.lotDepth * scale) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${data.lotDepth}m`, 0, 0);
    ctx.restore();
  };

  const buildAIRequest = () => ({
    totalArea: data.totalArea,
    lotWidth: data.lotWidth,
    lotDepth: data.lotDepth,
    bedrooms: data.bedrooms,
    suites: 1,
    bathrooms: data.bathrooms,
    livingStyle: 'integrated' as const,
    additionalSpaces: [
      ...(data.hasGarage ? ['Garagem'] : []),
      ...(data.hasBalcony ? ['Varanda'] : [])
    ],
    architecturalStyle: 'minimalista_brasileiro',
    drawingStyle: 'technical_2d' as const
  });

  const handleGenerateAI = async (quality: 'fast' | 'pro' = 'fast') => {
    setAiLoading(true);
    setView('ai');
    const t = toast.loading(quality === 'pro' ? 'Gerando planta com qualidade Pro...' : 'Gerando planta com IA...', {
      description: quality === 'pro' ? 'Pode levar até 60s' : 'Aguarde alguns segundos'
    });
    try {
      const result = await aiService.generateFloorPlan(buildAIRequest(), quality);
      toast.dismiss(t);
      if (result.success && result.imageUrl) {
        setAiImageUrl(result.imageUrl);
        toast.success('Planta gerada com sucesso!');
      } else {
        toast.error('Erro ao gerar planta', { description: result.error });
        setView('schematic');
      }
    } catch (e) {
      toast.dismiss(t);
      toast.error('Erro inesperado');
      setView('schematic');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerate3D = async () => {
    setLoading3D(true);
    setShow3DDialog(true);
    const t = toast.loading('Gerando vista 3D isométrica...', {
      description: 'Renderização Pro - até 60s'
    });
    try {
      const result = await aiService.generate3D(buildAIRequest(), aiImageUrl || undefined);
      toast.dismiss(t);
      if (result.success && result.imageUrl) {
        setImage3D(result.imageUrl);
        toast.success('Vista 3D gerada!');
      } else {
        toast.error('Erro na geração 3D', { description: result.error });
        setShow3DDialog(false);
      }
    } catch (e) {
      toast.dismiss(t);
      toast.error('Erro na geração 3D');
      setShow3DDialog(false);
    } finally {
      setLoading3D(false);
    }
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 50));
  const handleZoomOut = () => setScale(prev => Math.max(prev * 0.8, 10));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-foreground">Planta Baixa Gerada</h3>
          <p className="text-text-secondary">
            Área: {data.totalArea}m² | Terreno: {data.lotWidth}m × {data.lotDepth}m
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {view === 'schematic' && (
            <>
              <Button variant="outline" size="sm" onClick={handleZoomOut}><ZoomOut className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" onClick={handleZoomIn}><ZoomIn className="w-4 h-4" /></Button>
            </>
          )}
          <Badge variant="secondary">Escala 1:100</Badge>
        </div>
      </div>

      {/* Toggle entre esquemática e IA */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={view === 'schematic' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('schematic')}
        >
          Vista Esquemática
        </Button>
        <Button
          variant={view === 'ai' ? 'default' : 'outline'}
          size="sm"
          onClick={() => aiImageUrl ? setView('ai') : handleGenerateAI('fast')}
          disabled={aiLoading}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Vista Renderizada (IA)
        </Button>
        {view === 'ai' && aiImageUrl && (
          <>
            <Button variant="outline" size="sm" onClick={() => handleGenerateAI('fast')} disabled={aiLoading}>
              <RefreshCw className="w-4 h-4 mr-2" />Refazer
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleGenerateAI('pro')} disabled={aiLoading}>
              <Sparkles className="w-4 h-4 mr-2" />Qualidade Pro
            </Button>
          </>
        )}
      </div>

      <Card className="card-elevated">
        <CardContent className="p-6">
          {view === 'schematic' && (
            <div
              className="bg-white rounded-lg border overflow-auto flex items-center justify-center"
              style={{ height: Math.max(400, Math.min(600, data.lotDepth * scale + 100)) + 'px', width: '100%' }}
            >
              <canvas
                ref={canvasRef}
                width={Math.max(600, data.lotWidth * scale + 100)}
                height={Math.max(400, data.lotDepth * scale + 100)}
              />
            </div>
          )}

          {view === 'ai' && (
            <div className="bg-white dark:bg-card rounded-lg border min-h-[400px] flex items-center justify-center">
              {aiLoading && (
                <div className="text-center p-12">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-text-secondary">Gerando planta com IA...</p>
                </div>
              )}
              {!aiLoading && aiImageUrl && (
                <img src={aiImageUrl} alt="Planta baixa gerada por IA" className="max-w-full h-auto rounded-md" />
              )}
              {!aiLoading && !aiImageUrl && (
                <div className="text-center p-12">
                  <p className="text-text-secondary mb-4">Clique para gerar a planta com IA</p>
                  <Button onClick={() => handleGenerateAI('fast')} className="btn-primary">
                    <Sparkles className="w-4 h-4 mr-2" />Gerar Agora
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Eye className="w-5 h-5 mr-2" />Legenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rooms.map(room => (
              <div key={room.id} className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded border" style={{
                  backgroundColor: ({ bedroom: '#fef3c7', bathroom: '#dbeafe', living: '#d1fae5',
                    kitchen: '#fce7f3', garage: '#f3f4f6', balcony: '#e0f2fe' } as any)[room.type]
                }} />
                <span className="text-sm">{room.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Button onClick={() => onExportPDF(aiImageUrl || undefined)} className="btn-primary h-12">
          <FileText className="w-5 h-5 mr-2" />Exportar PDF
        </Button>
        <Button onClick={onExportDWG} variant="outline" className="h-12">
          <Download className="w-5 h-5 mr-2" />Baixar DWG
        </Button>
        <Button onClick={handleGenerate3D} variant="outline" className="h-12" disabled={loading3D}>
          <Box className="w-5 h-5 mr-2" />Gerar 3D
        </Button>
      </div>

      <Dialog open={show3DDialog} onOpenChange={setShow3DDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Vista 3D Isométrica</DialogTitle>
          </DialogHeader>
          <div className="min-h-[400px] flex items-center justify-center">
            {loading3D && (
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-text-secondary">Renderizando vista 3D com IA...</p>
                <p className="text-xs text-text-tertiary mt-2">Pé direito 2.5m</p>
              </div>
            )}
            {!loading3D && image3D && (
              <div className="space-y-4 w-full">
                <img src={image3D} alt="Vista 3D" className="w-full h-auto rounded-lg" />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={handleGenerate3D}>
                    <RefreshCw className="w-4 h-4 mr-2" />Gerar outra
                  </Button>
                  <a href={image3D} download="vista-3d.png">
                    <Button size="sm"><Download className="w-4 h-4 mr-2" />Baixar</Button>
                  </a>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
