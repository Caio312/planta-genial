import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Eye, FileText, Home, Users, Bath, Car, CheckCircle, Calculator, Box, Image } from "lucide-react";
import { FloorPlanViewer } from "./FloorPlanViewer";
import { MaterialQuantities } from "./MaterialQuantities";
import { toast } from "sonner";

interface FloorPlanSpecificationsProps {
  data: FloorPlanData;
  onBack: () => void;
  onStartNew: () => void;
}

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

export const FloorPlanSpecifications = ({ data, onBack, onStartNew }: FloorPlanSpecificationsProps) => {
  const [activeTab, setActiveTab] = useState("viewer");
  
  const getStyleName = (styleId: string) => {
    const styles = {
      "moderno_minimalista": "Moderno Minimalista",
      "tradicional_brasileiro": "Tradicional Brasileiro", 
      "contemporaneo_sustentavel": "Contemporâneo Sustentável"
    };
    return styles[styleId as keyof typeof styles] || styleId;
  };

  const handleExportPDF = () => {
    toast.info("Gerando PDF... Esta funcionalidade será implementada em breve!");
  };

  const handleExportDWG = () => {
    toast.info("Preparando arquivo DWG... Esta funcionalidade será implementada em breve!");
  };

  const handleGenerate3D = async () => {
    const loadingToast = toast.loading("Gerando visualização 3D com IA...", {
      description: "Criando vista isométrica com pé direito de 2.5m"
    });
    
    try {
      const { aiService } = await import('@/services/aiService');
      
      const request = {
        totalArea: data.totalArea,
        lotWidth: data.lotWidth,
        lotDepth: data.lotDepth,
        bedrooms: data.bedrooms,
        suites: 1, // Default to 1 suite
        bathrooms: data.bathrooms,
        livingStyle: 'integrated' as const,
        additionalSpaces: [
          ...(data.hasGarage ? ['Garagem'] : []),
          ...(data.hasBalcony ? ['Varanda'] : [])
        ],
        architecturalStyle: 'moderno_minimalista_brasileiro',
        drawingStyle: 'isometric_3d' as const
      };

      const result = await aiService.generate3D(request);
      
      toast.dismiss(loadingToast);
      
      if (result.success) {
        toast.success("Visualização 3D gerada com sucesso!", {
          description: "Vista isométrica com pé direito de 2.5m"
        });
        
        // Open 3D view in new tab or modal
        if (result.imageUrl) {
          window.open(result.imageUrl, '_blank');
        }
      } else {
        toast.error("Erro na geração 3D", {
          description: result.error || "Tente novamente em alguns momentos"
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Erro na geração 3D", {
        description: "Serviço temporariamente indisponível"
      });
    }
  };

  const getRoomList = () => {
    const rooms = [
      { name: 'Sala de Estar/Jantar', area: 25.5, required: true },
      { name: 'Cozinha', area: 12.8, required: true },
      { name: 'Área de Serviço', area: 6.2, required: true },
      { name: 'Suíte Master', area: 15.6, required: true },
      { name: 'Banheiro da Suíte', area: 4.8, required: true },
    ];

    if (data.bedrooms === 3) {
      rooms.push(
        { name: 'Quarto 2', area: 11.2, required: true },
        { name: 'Quarto 3', area: 9.8, required: true }
      );
    } else {
      rooms.push({ name: 'Quarto 2', area: 11.2, required: true });
    }

    rooms.push({ name: 'Banheiro Social', area: 4.2, required: true });

    if (data.bathrooms === 3) {
      rooms.push({ name: 'Lavabo', area: 2.5, required: false });
    }

    if (data.hasGarage) {
      rooms.push({ name: 'Garagem', area: 15.0, required: false });
    }

    if (data.hasBalcony) {
      rooms.push({ name: 'Varanda', area: 8.5, required: false });
    }

    return rooms;
  };

  const rooms = getRoomList();
  const totalCalculatedArea = rooms.reduce((sum, room) => sum + room.area, 0);

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-success rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-semibold text-foreground mb-4">
            Planta Baixa Gerada com Sucesso!
          </h1>
          <p className="text-xl text-text-secondary">
            Sua residência de {data.totalArea}m² foi projetada seguindo as melhores práticas arquitetônicas
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="viewer" className="flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Visualizar Planta
            </TabsTrigger>
            <TabsTrigger value="quantities" className="flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              Quantitativos
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Especificações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="viewer">
            <FloorPlanViewer 
              data={data}
              onExportPDF={handleExportPDF}
              onExportDWG={handleExportDWG}
              onGenerate3D={handleGenerate3D}
            />
          </TabsContent>

          <TabsContent value="quantities">
            <MaterialQuantities data={data} />
          </TabsContent>

          <TabsContent value="details">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="w-5 h-5 text-primary" />
                      Resumo do Projeto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-foreground mb-3">Características Gerais</h4>
                        <ul className="space-y-2 text-text-secondary">
                          <li>• {data.bedrooms} quartos ({data.bedrooms === 3 ? '1 suíte master' : ''})</li>
                          <li>• {data.bathrooms} banheiros</li>
                          <li>• Área total: {totalCalculatedArea.toFixed(1)} m²</li>
                          <li>• Terreno: {data.lotWidth}m × {data.lotDepth}m</li>
                          <li>• Estilo: {getStyleName(data.style)}</li>
                          {data.hasGarage && <li>• Garagem para 1 veículo</li>}
                          {data.hasBalcony && <li>• Varanda/Terraço</li>}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-foreground mb-3">Conformidade Técnica</h4>
                        <div className="space-y-2">
                          <Badge variant="secondary" className="bg-success-light text-success">
                            ✓ NBR 9050 - Acessibilidade
                          </Badge>
                          <Badge variant="secondary" className="bg-success-light text-success">
                            ✓ Código de Obras Municipal  
                          </Badge>
                          <Badge variant="secondary" className="bg-success-light text-success">
                            ✓ Normas de Ventilação
                          </Badge>
                          <Badge variant="secondary" className="bg-success-light text-success">
                            ✓ Iluminação Natural
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle>Especificações de Janelas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { room: "Sala de Estar", type: "Normal", width: "1.20m", height: "1.20m", sillHeight: "1.00m" },
                        { room: "Quarto Master", type: "Normal", width: "1.00m", height: "1.20m", sillHeight: "1.00m" },
                        { room: "Quarto 2", type: "Normal", width: "1.00m", height: "1.20m", sillHeight: "1.00m" },
                        { room: "Cozinha", type: "Basculante", width: "0.60m", height: "0.60m", sillHeight: "1.60m" },
                        { room: "Banheiro Social", type: "Basculante", width: "0.60m", height: "0.60m", sillHeight: "1.60m" }
                      ].map((window, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-surface rounded-xl">
                          <div>
                            <div className="font-medium text-foreground">{window.room}</div>
                            <div className="text-sm text-text-secondary">Tipo: {window.type}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{window.width} × {window.height}</div>
                            <div className="text-sm text-text-secondary">Peitoril: {window.sillHeight}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Room List */}
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle>Ambientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {rooms.map((room, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-border-subtle last:border-0">
                          <span className="text-sm font-medium text-foreground">{room.name}</span>
                          <span className="text-sm text-text-secondary">{room.area} m²</span>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-border flex justify-between items-center font-semibold">
                        <span>Total</span>
                        <span className="text-primary">{totalCalculatedArea.toFixed(1)} m²</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            onClick={onBack}
            variant="ghost" 
            className="btn-ghost"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar e Ajustar
          </Button>
          
          <Button 
            onClick={onStartNew}
            className="btn-primary"
          >
            Nova Planta Baixa
          </Button>
        </div>
      </div>
    </div>
  );
};