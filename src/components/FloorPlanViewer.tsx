import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileCode, Bot } from "lucide-react";
import { toast } from 'sonner';
import { searchFloorPlanReferences } from '@/services/imageSearch';
import { ReferenceGallery } from './ReferenceGallery';
import { enforceConstraints } from '@/lib/constraints';

interface Room {
  id: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  type: string;
  windows?: Array<any>;
  doors?: Array<any>;
}

interface FloorPlanData {
  totalArea?: number;
  lotWidth: number;
  lotDepth: number;
  bedrooms: number;
  bathrooms?: number;
  hasGarage?: boolean;
  hasBalcony?: boolean;
  style?: string;
}

interface Props {
  data: FloorPlanData;
  onExportPDF: () => void;
  onExportDWG: () => void;
  onGenerate3D: () => void;
}

export const FloorPlanViewer = forwardRef<HTMLDivElement, Props>(function FloorPlanViewer(
  { data, onExportPDF, onExportDWG, onGenerate3D },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedReference, setSelectedReference] = useState<{ id: string; url: string } | null>(null);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [scale, setScale] = useState(20);
  const [warnings, setWarnings] = useState<string[]>([]);
  const offset = { x: 40, y: 40 };

  const referenceQuery = `${data.totalArea ?? ''} ${data.bedrooms} quartos ${data.style ?? ''}`.trim();

  // generate base rooms and apply constraints
  useEffect(() => {
    const generateFloorPlan = () => {
      const generated: Room[] = [
        {
          id: 'living',
          name: 'Sala',
          width: 4,
          height: 3,
          x: 1,
          y: 1,
          type: 'living',
          doors: [{ x: 3.9, y: 1.5, width: 0.9 }]
        }
      ];

      // crie specs a partir do 'data' ou UI (ex.: modo acessível/parametrizado)
      const specsFromUI: FloorPlanSpecifications = {
        minBedroomCoupleArea: data.totalArea ? undefined : undefined,
        // ...mapear opções do usuário se houver...
      };

      const result = enforceConstraints(generated, {
        lotWidth: data.lotWidth,
        lotDepth: data.lotDepth,
        bedrooms: data.bedrooms,
        totalArea: data.totalArea
      });

      setRooms(result.rooms);
      if (result.warnings?.length) {
        result.warnings.forEach(w => console.warn('[Constraint]', w));
      }
    };

    generateFloorPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // draw function
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // grid
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx < canvas.width; gx += scale) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, canvas.height); ctx.stroke();
    }
    for (let gy = 0; gy < canvas.height; gy += scale) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(canvas.width, gy); ctx.stroke();
    }

    // draw rooms
    ctx.strokeStyle = '#111';
    ctx.fillStyle = '#333';
    rooms.forEach(r => {
      const x = offset.x + r.x * scale;
      const y = offset.y + r.y * scale;
      const w = r.width * scale;
      const h = r.height * scale;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.font = '14px Arial';
      ctx.fillStyle = '#333';
      ctx.fillText(r.name, x + 6, y + 18);
      ctx.fillText(`${(r.width * r.height).toFixed(1)} m²`, x + 6, y + 36);

      (r.windows || []).forEach((wnd: any) => {
        const wx = x + (wnd.x ?? 0) * scale;
        const wy = y + (wnd.y ?? 0) * scale;
        const ww = (wnd.width ?? 0) * scale;
        const wh = Math.max(4, (wnd.height ?? 0.1) * scale);
        ctx.strokeStyle = '#0a84ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(wx, wy, ww, wh);
        ctx.beginPath();
        ctx.moveTo(wx - 6, wy + wh);
        ctx.lineTo(wx + ww + 6, wy + wh);
        ctx.stroke();
      });

      (r.doors || []).forEach((d: any) => {
        const dx = offset.x + (r.x + d.x) * scale;
        const dy = offset.y + (r.y + d.y) * scale;
        ctx.beginPath();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.arc(dx, dy, 12, 0, Math.PI / 2);
        ctx.stroke();
      });
    });

    // overlay selected reference with low opacity
    if (selectedReference) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      };
      img.onerror = () => {
        console.warn('Falha ao carregar imagem de referência');
      };
      img.src = selectedReference.url;
    }
  }, [rooms, selectedReference, scale]);

  // optional debug load of refs (non-blocking)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoadingRefs(true);
        const res = await searchFloorPlanReferences(referenceQuery);
        if (mounted && res && res.length) console.log('refs preview:', res);
      } catch (e) {
        console.warn('Erro ao buscar refs (não bloqueante)', e);
      } finally {
        if (mounted) setLoadingRefs(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [referenceQuery]);

  const handleReferenceSelect = (refSel: { id: string; url: string }) => {
    setSelectedReference(refSel);
    toast.success('Referência aplicada (apenas sobreposição visual).');
  };

  const zoomIn = () => setScale(s => Math.min(60, s + 4));
  const zoomOut = () => setScale(s => Math.max(8, s - 4));

  return (
    <Card className="card-elevated overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium mb-2">Referências Similares</h3>
          <ReferenceGallery query={referenceQuery} onSelectReference={handleReferenceSelect} />
        </div>

        <div ref={ref} className="bg-white p-8">
          <div className="relative aspect-w-16 aspect-h-11">
            <canvas
              ref={canvasRef}
              width={1200}
              height={800}
              className="w-full h-full object-contain rounded-lg border border-border"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button variant="outline" size="icon" onClick={zoomIn}>+</Button>
              <Button variant="outline" size="icon" onClick={zoomOut}>-</Button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-surface-subtle border-t border-border flex flex-wrap items-center justify-center gap-4">
          <Button onClick={onExportPDF} className="btn-primary">
            <Download className="w-4 h-4 mr-2" /> Exportar para PDF
          </Button>
          <Button onClick={onExportDWG} variant="outline" className="btn-outline">
            <FileCode className="w-4 h-4 mr-2" /> Baixar em DWG (CAD)
          </Button>
          <Button onClick={onGenerate3D} variant="outline" className="btn-outline">
            <Bot className="w-4 h-4 mr-2" /> Gerar Visualização 3D (IA)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

FloorPlanViewer.displayName = 'FloorPlanViewer';