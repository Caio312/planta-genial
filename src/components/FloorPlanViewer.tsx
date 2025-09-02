import { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Maximize2, RotateCw, ZoomIn, ZoomOut, FileText, Box } from 'lucide-react';
import { toast } from 'sonner';

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
  windows?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'normal' | 'basculante';
    sillHeight: number;
  }>;
  doors?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

interface FloorPlanViewerProps {
  data: FloorPlanData;
  onExportPDF: () => void;
  onExportDWG: () => void;
  onGenerate3D: () => void;
}

export const FloorPlanViewer = ({ data, onExportPDF, onExportDWG, onGenerate3D }: FloorPlanViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [scale, setScale] = useState(20); // pixels per meter
  const [offset, setOffset] = useState({ x: 50, y: 50 });

  useEffect(() => {
    generateFloorPlan();
  }, [data]);

  const generateFloorPlan = () => {
    // Simple automatic room layout generation
    const generatedRooms: Room[] = [];
    let currentX = 1; // Start 1m from edge
    let currentY = 1;
    
    // Living room
    const livingWidth = Math.min(6, data.lotWidth - 2);
    const livingHeight = Math.min(4, data.lotDepth * 0.3);
    generatedRooms.push({
      id: 'living',
      name: 'Sala de Estar',
      width: livingWidth,
      height: livingHeight,
      x: currentX,
      y: currentY,
      type: 'living',
      windows: [
        {
          x: 0,
          y: livingHeight / 2 - 0.6,
          width: 1.2,
          height: 1.2,
          type: 'normal',
          sillHeight: 1.0
        }
      ],
      doors: [
        {
          x: livingWidth - 0.1,
          y: livingHeight / 2 - 0.4,
          width: 0.8,
          height: 2.1
        }
      ]
    });

    currentX += livingWidth + 0.15; // Wall thickness

    // Kitchen
    const kitchenWidth = Math.min(3.5, data.lotWidth - currentX - 1);
    const kitchenHeight = livingHeight;
    generatedRooms.push({
      id: 'kitchen',
      name: 'Cozinha',
      width: kitchenWidth,
      height: kitchenHeight,
      x: currentX,
      y: currentY,
      type: 'kitchen',
      windows: [
        {
          x: kitchenWidth - 0.6,
          y: 0,
          width: 0.6,
          height: 0.6,
          type: 'basculante',
          sillHeight: 1.6
        }
      ]
    });

    currentY += livingHeight + 0.15;
    currentX = 1;

    // Bedrooms
    const bedroomWidth = (data.lotWidth - 3 - 0.15) / data.bedrooms;
    for (let i = 0; i < data.bedrooms; i++) {
        const isMaster = i === 0;
        generatedRooms.push({
          id: `bedroom${i + 1}`,
          name: isMaster ? 'Quarto Master' : `Quarto ${i + 1}`,
          width: bedroomWidth,
          height: isMaster ? 4 : 3.5,
        x: currentX + i * (bedroomWidth + 0.15),
        y: currentY,
        type: 'bedroom',
        windows: [
          {
            x: 0,
            y: 1,
            width: 1.0,
            height: 1.2,
            type: 'normal',
            sillHeight: 1.0
          }
        ]
      });
    }

    // Bathrooms
    const bathroomWidth = 2.5;
    const bathroomHeight = 2.0;
    for (let i = 0; i < data.bathrooms; i++) {
      generatedRooms.push({
        id: `bathroom${i + 1}`,
        name: `Banheiro ${i === 0 ? 'Social' : i + 1}`,
        width: bathroomWidth,
        height: bathroomHeight,
        x: data.lotWidth - bathroomWidth - 1,
        y: currentY + i * (bathroomHeight + 0.15),
        type: 'bathroom',
        windows: [
          {
            x: bathroomWidth - 0.6,
            y: 0,
            width: 0.6,
            height: 0.6,
            type: 'basculante',
            sillHeight: 1.6
          }
        ]
      });
    }

    // Garage if enabled
    if (data.hasGarage) {
      generatedRooms.push({
        id: 'garage',
        name: 'Garagem',
        width: 3.5,
        height: 5.5,
        x: currentX,
        y: data.lotDepth - 6.5,
        type: 'garage'
      });
    }

    setRooms(generatedRooms);
    drawFloorPlan(generatedRooms);
  };

  const drawFloorPlan = (roomsToDraw: Room[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up drawing style
    ctx.font = '12px Inter';
    ctx.lineWidth = 2;

    // Draw lot boundary
    ctx.strokeStyle = '#e5e7eb';
    ctx.strokeRect(
      offset.x,
      offset.y,
      data.lotWidth * scale,
      data.lotDepth * scale
    );

    // Draw rooms
    roomsToDraw.forEach(room => {
      const roomX = offset.x + room.x * scale;
      const roomY = offset.y + room.y * scale;
      const roomW = room.width * scale;
      const roomH = room.height * scale;

      // Room outline
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;
      ctx.strokeRect(roomX, roomY, roomW, roomH);

      // Room fill based on type
      const fillColors = {
        bedroom: '#fef3c7',
        bathroom: '#dbeafe',
        living: '#d1fae5',
        kitchen: '#fce7f3',
        garage: '#f3f4f6',
        balcony: '#e0f2fe'
      };
      
      ctx.fillStyle = fillColors[room.type] || '#f9fafb';
      ctx.fillRect(roomX, roomY, roomW, roomH);

      // Room label
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(
        room.name,
        roomX + roomW / 2,
        roomY + roomH / 2 - 10
      );

      // Room dimensions
      ctx.font = '10px Inter';
      ctx.fillText(
        `${room.width.toFixed(1)}m × ${room.height.toFixed(1)}m`,
        roomX + roomW / 2,
        roomY + roomH / 2 + 5
      );

      // Draw windows
      room.windows?.forEach(window => {
        const winX = roomX + window.x * scale;
        const winY = roomY + window.y * scale;
        const winW = window.width * scale;
        const winH = window.height * scale;

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.strokeRect(winX, winY, winW, winH);

        // Window type indicator
        ctx.fillStyle = '#3b82f6';
        ctx.font = '8px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(
          window.type === 'basculante' ? 'B' : 'J',
          winX + 2,
          winY + 10
        );
      });

      // Draw doors
      room.doors?.forEach(door => {
        const doorX = roomX + door.x * scale;
        const doorY = roomY + door.y * scale;
        const doorW = door.width * scale;

        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(doorX, doorY + doorW / 2, doorW / 2, 0, Math.PI);
        ctx.stroke();
      });
    });

    // Draw dimensions
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';

    // Lot dimensions
    ctx.fillText(
      `${data.lotWidth}m`,
      offset.x + (data.lotWidth * scale) / 2,
      offset.y - 10
    );
    
    ctx.save();
    ctx.translate(offset.x - 20, offset.y + (data.lotDepth * scale) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${data.lotDepth}m`, 0, 0);
    ctx.restore();
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 50));
  const handleZoomOut = () => setScale(prev => Math.max(prev * 0.8, 10));

  return (
    <div className="space-y-6">
      {/* Viewer Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-foreground">Planta Baixa Gerada</h3>
          <p className="text-text-secondary">
            Área total: {data.totalArea}m² | Terreno: {data.lotWidth}m × {data.lotDepth}m
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Badge variant="secondary">Escala 1:100</Badge>
        </div>
      </div>

      {/* Canvas Viewer */}
      <Card className="card-elevated">
        <CardContent className="p-6">
          <div className="bg-white rounded-lg border overflow-auto" style={{ height: '500px' }}>
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="cursor-move"
            />
          </div>
        </CardContent>
      </Card>

      {/* Room Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Legenda dos Ambientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rooms.map(room => (
              <div key={room.id} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{
                    backgroundColor: {
                      bedroom: '#fef3c7',
                      bathroom: '#dbeafe', 
                      living: '#d1fae5',
                      kitchen: '#fce7f3',
                      garage: '#f3f4f6',
                      balcony: '#e0f2fe'
                    }[room.type]
                  }}
                />
                <span className="text-sm">{room.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Button onClick={onExportPDF} className="btn-primary h-12">
          <FileText className="w-5 h-5 mr-2" />
          Exportar PDF
        </Button>
        
        <Button onClick={onExportDWG} variant="outline" className="h-12">
          <Download className="w-5 h-5 mr-2" />
          Baixar DWG
        </Button>
        
        <Button onClick={onGenerate3D} variant="outline" className="h-12">
          <Box className="w-5 h-5 mr-2" />
          Gerar 3D
        </Button>
      </div>
    </div>
  );
};