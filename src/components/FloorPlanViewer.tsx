import { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Eye, ZoomIn, ZoomOut, FileText, Box, Sparkles, Loader2, RefreshCw, AlertTriangle, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import { aiService } from '@/services/aiService';
import {
  generateLayout as engineGenerateLayout,
  validateNBR,
  PATTERN_LABELS,
  type LayoutPattern,
  type Room as EngineRoom,
  type RoomType as EngineRoomType,
} from '@/services/layoutEngine';

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

type RoomType = EngineRoomType;
type Room = EngineRoom;

interface FloorPlanViewerProps {
  data: FloorPlanData;
  onExportPDF: (aiImageUrl?: string) => void;
  onExportDWG: (rooms: Room[]) => void;
}

const ROOM_COLORS: Record<RoomType, string> = {
  bedroom: '#fef3c7',
  suite: '#fde68a',
  bathroom: '#dbeafe',
  living: '#d1fae5',
  kitchen: '#fce7f3',
  service: '#e0e7ff',
  garage: '#f3f4f6',
  balcony: '#cffafe',
  circulation: '#f9fafb',
};

const ROOM_LABELS: Record<RoomType, string> = {
  bedroom: 'Quarto', suite: 'Suíte', bathroom: 'Banheiro', living: 'Sala/Cozinha',
  kitchen: 'Cozinha', service: 'Serviço', garage: 'Garagem', balcony: 'Varanda', circulation: 'Circulação'
};

/**
 * Layout generator: divide a casa em zona social (frente) e zona íntima (fundos),
 * com corredor central. Garagem ocupa lateral. Bem mais coerente que o anterior.
 */
function generateLayout(data: FloorPlanData): Room[] {
  const rooms: Room[] = [];
  const M = 0.5; // recuo do terreno
  const W = data.lotWidth - 2 * M;
  const D = data.lotDepth - 2 * M;

  // Garagem na lateral esquerda da frente, se habilitada
  const garageW = data.hasGarage ? Math.min(3.2, W * 0.3) : 0;
  if (data.hasGarage) {
    rooms.push({
      id: 'garage', name: 'Garagem', type: 'garage',
      x: M, y: M, width: garageW, height: 5.5,
      doors: [{ x: garageW / 2 - 1.25, y: 0, width: 2.5, wall: 'top', swing: 'out' }]
    });
  }

  const houseX = M + garageW + (data.hasGarage ? 0.15 : 0);
  const houseW = W - garageW - (data.hasGarage ? 0.15 : 0);
  const houseY = M;
  const houseD = D;

  // Zona social (frente): sala + cozinha integradas + varanda opcional
  const balconyD = data.hasBalcony ? 1.8 : 0;
  if (data.hasBalcony) {
    rooms.push({
      id: 'balcony', name: 'Varanda', type: 'balcony',
      x: houseX, y: houseY, width: houseW, height: balconyD
    });
  }

  const socialY = houseY + balconyD + (data.hasBalcony ? 0.15 : 0);
  const socialD = Math.max(4.5, houseD * 0.38);
  rooms.push({
    id: 'living', name: 'Sala / Cozinha', type: 'living',
    x: houseX, y: socialY, width: houseW, height: socialD,
    windows: [
      { x: 0.5, y: 0, width: 2.0, type: 'normal', wall: 'top' },
      { x: houseW - 2.5, y: 0, width: 1.5, type: 'normal', wall: 'top' }
    ],
    doors: [{ x: houseW / 2 - 0.45, y: 0, width: 0.9, wall: 'top', swing: 'in' }]
  });

  // Área de serviço
  const serviceW = Math.min(2.5, houseW * 0.3);
  const serviceD = 2.0;
  rooms.push({
    id: 'service', name: 'Serviço', type: 'service',
    x: houseX + houseW - serviceW, y: socialY + socialD + 0.15,
    width: serviceW, height: serviceD,
    windows: [{ x: serviceW - 0.8, y: 0, width: 0.6, type: 'basculante', wall: 'right' }]
  });

  // Zona íntima (fundos): corredor + quartos + banheiros
  const intimateY = socialY + socialD + 0.15;
  const intimateD = houseD - intimateY + houseY;
  const corridorH = 1.1;

  rooms.push({
    id: 'corridor', name: 'Circulação', type: 'circulation',
    x: houseX, y: intimateY, width: houseW - serviceW - 0.15, height: corridorH,
  });

  // Quartos abaixo do corredor
  const bedroomsY = intimateY + corridorH + 0.15;
  const bedroomsD = intimateD - corridorH - 0.15;
  const totalRooms = data.bedrooms;
  const bathW = 1.8;
  const availW = houseW - bathW - 0.15;
  const bedW = availW / totalRooms;

  for (let i = 0; i < totalRooms; i++) {
    const isSuite = i === 0;
    rooms.push({
      id: `bed${i}`, name: isSuite ? 'Suíte' : `Quarto ${i + 1}`,
      type: isSuite ? 'suite' : 'bedroom',
      x: houseX + i * (bedW + (i > 0 ? 0.15 : 0)),
      y: bedroomsY,
      width: bedW - (i > 0 ? 0.15 : 0),
      height: bedroomsD,
      windows: [{ x: bedW / 2 - 0.6, y: bedroomsD - 0.05, width: 1.2, type: 'normal', wall: 'bottom' }],
      doors: [{ x: bedW / 2 - 0.4, y: 0, width: 0.8, wall: 'top', swing: 'in' }]
    });
  }

  // Banheiros à direita
  const bathH = bedroomsD / Math.max(1, data.bathrooms);
  for (let i = 0; i < data.bathrooms; i++) {
    rooms.push({
      id: `bath${i}`, name: i === 0 ? 'Banheiro' : `Banheiro ${i + 1}`, type: 'bathroom',
      x: houseX + houseW - bathW,
      y: bedroomsY + i * bathH,
      width: bathW,
      height: bathH - (i < data.bathrooms - 1 ? 0.15 : 0),
      windows: [{ x: bathW - 0.7, y: 0, width: 0.6, type: 'basculante', wall: 'right' }],
      doors: [{ x: 0, y: bathH / 2 - 0.35, width: 0.7, wall: 'left', swing: 'in' }]
    });
  }

  return rooms;
}

export const FloorPlanViewer = ({ data, onExportPDF, onExportDWG }: FloorPlanViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [scale, setScale] = useState(28);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [view, setView] = useState<'schematic' | 'ai'>('schematic');
  const [image3D, setImage3D] = useState<string | null>(null);
  const [loading3D, setLoading3D] = useState(false);
  const [show3DDialog, setShow3DDialog] = useState(false);

  const PAD = 70; // padding para cotas externas

  useEffect(() => {
    const generated = generateLayout(data);
    setRooms(generated);
  }, [data]);

  useEffect(() => {
    if (rooms.length === 0) return;
    requestAnimationFrame(() => drawFloorPlan());
  }, [rooms, scale]);

  const drawFloorPlan = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = data.lotWidth * scale + PAD * 2;
    const h = data.lotDepth * scale + PAD * 2;
    canvas.width = w;
    canvas.height = h;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Grade leve
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= data.lotWidth; i++) {
      const x = PAD + i * scale;
      ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, PAD + data.lotDepth * scale); ctx.stroke();
    }
    for (let i = 0; i <= data.lotDepth; i++) {
      const y = PAD + i * scale;
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(PAD + data.lotWidth * scale, y); ctx.stroke();
    }

    // Contorno do terreno (tracejado)
    ctx.strokeStyle = '#9ca3af';
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(PAD, PAD, data.lotWidth * scale, data.lotDepth * scale);
    ctx.setLineDash([]);

    // Ambientes
    rooms.forEach(room => {
      const rx = PAD + room.x * scale;
      const ry = PAD + room.y * scale;
      const rw = room.width * scale;
      const rh = room.height * scale;

      ctx.fillStyle = ROOM_COLORS[room.type];
      ctx.fillRect(rx, ry, rw, rh);

      // Paredes externas mais grossas
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = room.type === 'circulation' ? 1.5 : 3;
      ctx.strokeRect(rx, ry, rw, rh);

      // Nome + área
      const area = (room.width * room.height).toFixed(1);
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'center';
      ctx.font = `bold ${Math.max(10, scale * 0.4)}px Inter, sans-serif`;
      ctx.fillText(room.name, rx + rw / 2, ry + rh / 2 - 2);
      ctx.font = `${Math.max(9, scale * 0.32)}px Inter, sans-serif`;
      ctx.fillStyle = '#4b5563';
      ctx.fillText(`${area} m²`, rx + rw / 2, ry + rh / 2 + scale * 0.4);

      // Janelas
      room.windows?.forEach(win => {
        const ww = win.width * scale;
        let wx = rx, wy = ry, wwx = ww, wwy = 6;
        if (win.wall === 'top') { wx = rx + win.x * scale; wy = ry - 3; }
        else if (win.wall === 'bottom') { wx = rx + win.x * scale; wy = ry + rh - 3; }
        else if (win.wall === 'left') { wx = rx - 3; wy = ry + win.x * scale; wwx = 6; wwy = ww; }
        else if (win.wall === 'right') { wx = rx + rw - 3; wy = ry + win.x * scale; wwx = 6; wwy = ww; }

        // Branco por baixo (apaga parede)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wx, wy, wwx, wwy);
        // Linhas duplas (símbolo janela NBR)
        ctx.strokeStyle = win.type === 'basculante' ? '#0ea5e9' : '#2563eb';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(wx, wy, wwx, wwy);
        if (wwx > wwy) {
          ctx.beginPath(); ctx.moveTo(wx, wy + wwy / 2); ctx.lineTo(wx + wwx, wy + wwy / 2); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.moveTo(wx + wwx / 2, wy); ctx.lineTo(wx + wwx / 2, wy + wwy); ctx.stroke();
        }
      });

      // Portas (arco de abertura)
      room.doors?.forEach(door => {
        const dw = door.width * scale;
        let hx = rx, hy = ry, ang = 0;
        if (door.wall === 'top') { hx = rx + door.x * scale; hy = ry; ang = 0; }
        else if (door.wall === 'bottom') { hx = rx + door.x * scale; hy = ry + rh; ang = Math.PI; }
        else if (door.wall === 'left') { hx = rx; hy = ry + door.y * scale; ang = -Math.PI / 2; }
        else if (door.wall === 'right') { hx = rx + rw; hy = ry + door.y * scale; ang = Math.PI / 2; }

        // Apaga parede no vão
        ctx.fillStyle = '#ffffff';
        if (door.wall === 'top' || door.wall === 'bottom') ctx.fillRect(hx, hy - 2, dw, 4);
        else ctx.fillRect(hx - 2, hy, 4, dw);

        // Arco
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(hx, hy, dw, ang, ang + Math.PI / 2);
        ctx.stroke();
        // Folha
        ctx.beginPath(); ctx.moveTo(hx, hy);
        ctx.lineTo(hx + Math.cos(ang + Math.PI / 2) * dw, hy + Math.sin(ang + Math.PI / 2) * dw);
        ctx.stroke();
      });
    });

    // Cotas externas
    ctx.fillStyle = '#374151';
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    // Cota largura (topo)
    const cy = PAD - 30;
    ctx.beginPath(); ctx.moveTo(PAD, cy); ctx.lineTo(PAD + data.lotWidth * scale, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD, cy - 4); ctx.lineTo(PAD, cy + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD + data.lotWidth * scale, cy - 4); ctx.lineTo(PAD + data.lotWidth * scale, cy + 4); ctx.stroke();
    ctx.fillText(`${data.lotWidth.toFixed(2)} m`, PAD + (data.lotWidth * scale) / 2, cy - 8);

    // Cota altura (esquerda)
    const cx = PAD - 30;
    ctx.beginPath(); ctx.moveTo(cx, PAD); ctx.lineTo(cx, PAD + data.lotDepth * scale); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 4, PAD); ctx.lineTo(cx + 4, PAD); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 4, PAD + data.lotDepth * scale); ctx.lineTo(cx + 4, PAD + data.lotDepth * scale); ctx.stroke();
    ctx.save();
    ctx.translate(cx - 8, PAD + (data.lotDepth * scale) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${data.lotDepth.toFixed(2)} m`, 0, 0);
    ctx.restore();

    // Norte
    const nx = w - 40, ny = 40;
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.moveTo(nx, ny - 18); ctx.lineTo(nx - 7, ny + 8); ctx.lineTo(nx + 7, ny + 8); ctx.closePath();
    ctx.fill();
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('N', nx, ny + 22);

    // Escala
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('Escala 1:100', PAD, h - 10);
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
    const t = toast.loading(quality === 'pro' ? 'Gerando planta Pro...' : 'Gerando planta com IA...');
    try {
      const result = await aiService.generateFloorPlan(buildAIRequest(), quality);
      toast.dismiss(t);
      if (result.success && result.imageUrl) {
        setAiImageUrl(result.imageUrl);
        toast.success('Planta gerada!');
      } else {
        toast.error('Erro ao gerar', { description: result.error });
        setView('schematic');
      }
    } catch {
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
    const t = toast.loading('Gerando vista 3D...');
    try {
      const result = await aiService.generate3D(buildAIRequest(), aiImageUrl || undefined);
      toast.dismiss(t);
      if (result.success && result.imageUrl) {
        setImage3D(result.imageUrl);
        toast.success('Vista 3D pronta!');
      } else {
        toast.error('Erro 3D', { description: result.error });
      }
    } catch {
      toast.dismiss(t);
      toast.error('Erro 3D');
    } finally {
      setLoading3D(false);
    }
  };

  const download3D = () => {
    if (!image3D) return;
    const link = document.createElement('a');
    link.href = image3D;
    link.download = 'vista-3d.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const usedRoomTypes = Array.from(new Set(rooms.map(r => r.type)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-foreground">Planta Baixa</h3>
          <p className="text-text-secondary text-sm">
            {data.totalArea}m² construídos · Terreno {data.lotWidth}×{data.lotDepth}m
          </p>
        </div>
        <div className="flex items-center gap-2">
          {view === 'schematic' && (
            <>
              <Button variant="outline" size="sm" onClick={() => setScale(s => Math.max(s * 0.85, 12))}><ZoomOut className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setScale(s => Math.min(s * 1.15, 60))}><ZoomIn className="w-4 h-4" /></Button>
            </>
          )}
          <Badge variant="secondary">1:100</Badge>
        </div>
      </div>

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
        <CardContent className="p-4 md:p-6">
          {view === 'schematic' && (
            <div className="bg-white rounded-lg border overflow-auto" style={{ maxHeight: 720 }}>
              <canvas ref={canvasRef} className="block mx-auto" />
            </div>
          )}
          {view === 'ai' && (
            <div className="bg-white dark:bg-card rounded-lg border min-h-[420px] flex items-center justify-center">
              {aiLoading && (
                <div className="text-center p-12">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-text-secondary">Renderizando com IA...</p>
                </div>
              )}
              {!aiLoading && aiImageUrl && (
                <img src={aiImageUrl} alt="Planta IA" className="max-w-full h-auto rounded-md" />
              )}
              {!aiLoading && !aiImageUrl && (
                <Button onClick={() => handleGenerateAI('fast')} className="btn-primary">
                  <Sparkles className="w-4 h-4 mr-2" />Gerar com IA
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base"><Eye className="w-4 h-4 mr-2" />Legenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {usedRoomTypes.map(type => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: ROOM_COLORS[type] }} />
                <span className="text-sm text-text-secondary">{ROOM_LABELS[type]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Button onClick={() => onExportPDF(aiImageUrl || undefined)} className="btn-primary h-12">
          <FileText className="w-5 h-5 mr-2" />Exportar PDF
        </Button>
        <Button onClick={() => onExportDWG(rooms)} variant="outline" className="h-12">
          <Download className="w-5 h-5 mr-2" />Baixar DXF (CAD)
        </Button>
        <Button onClick={handleGenerate3D} variant="outline" className="h-12" disabled={loading3D}>
          <Box className="w-5 h-5 mr-2" />Gerar Vista 3D
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
                <p className="text-text-secondary">Renderizando 3D com IA...</p>
              </div>
            )}
            {!loading3D && image3D && (
              <div className="space-y-4 w-full">
                <img src={image3D} alt="Vista 3D" className="w-full h-auto rounded-lg" />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={handleGenerate3D}>
                    <RefreshCw className="w-4 h-4 mr-2" />Gerar outra
                  </Button>
                  <Button size="sm" onClick={download3D}>
                    <Download className="w-4 h-4 mr-2" />Baixar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
