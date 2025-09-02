import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Eye, Home, Ruler, FileText, Check } from "lucide-react";
import { toast } from "sonner";

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

interface FloorPlanSpecificationsProps {
  data: FloorPlanData;
  onBack: () => void;
  onStartNew: () => void;
}

export const FloorPlanSpecifications = ({ data, onBack, onStartNew }: FloorPlanSpecificationsProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'materials'>('overview');

  const handleExport = (format: string) => {
    toast.success(`Iniciando download em formato ${format.toUpperCase()}`);
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            onClick={onBack}
            variant="ghost" 
            className="btn-ghost"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar
          </Button>
          
          <div className="flex gap-3">
            <Button onClick={() => handleExport('pdf')} variant="outline" className="btn-secondary">
              <Download className="mr-2 w-4 h-4" />
              PDF
            </Button>
            <Button onClick={() => handleExport('dwg')} className="btn-primary">
              <Download className="mr-2 w-4 h-4" />
              DWG
            </Button>
          </div>
        </div>

        {/* Success Banner */}
        <div className="card-glass p-6 mb-8 border-l-4 border-l-success">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-success-light rounded-full mr-4">
              <Check className="w-5 h-5 text-success" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">
                Planta Baixa Gerada com Sucesso!
              </h2>
              <p className="text-text-secondary">
                Sua planta baixa técnica está pronta para download e uso profissional
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex space-x-1 bg-surface rounded-xl p-1">
              {[
                { id: 'overview', label: 'Visão Geral', icon: Eye },
                { id: 'technical', label: 'Especificações', icon: Ruler },
                { id: 'materials', label: 'Materiais', icon: FileText }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200
                      ${activeTab === tab.id 
                        ? 'bg-background text-primary shadow-sm' 
                        : 'text-text-secondary hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
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
            )}

            {activeTab === 'technical' && (
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle>Especificações Técnicas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Elementos Estruturais</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-surface p-4 rounded-lg">
                          <strong>Paredes Externas:</strong> 20cm (concreto armado)
                        </div>
                        <div className="bg-surface p-4 rounded-lg">
                          <strong>Paredes Internas:</strong> 15cm (alvenaria estrutural)
                        </div>
                        <div className="bg-surface p-4 rounded-lg">
                          <strong>Fundação:</strong> Radier (concreto armado)
                        </div>
                        <div className="bg-surface p-4 rounded-lg">
                          <strong>Cobertura:</strong> Laje + Telhado cerâmico
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Aberturas Padrão</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                          <span>Porta Principal</span>
                          <span className="text-text-secondary">0,90m × 2,10m</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                          <span>Portas Internas</span>
                          <span className="text-text-secondary">0,80m × 2,10m</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                          <span>Janelas Salas</span>
                          <span className="text-text-secondary">1,20m × 1,20m</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span>Janelas Quartos</span>
                          <span className="text-text-secondary">1,00m × 1,20m</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'materials' && (
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle>Lista de Materiais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { category: 'Estrutura', items: ['Concreto usinado', 'Aço CA-50', 'Blocos estruturais'] },
                      { category: 'Revestimentos', items: ['Cerâmica 60x60cm', 'Pintura acrílica', 'Gesso liso'] },
                      { category: 'Esquadrias', items: ['Janelas alumínio', 'Portas madeira', 'Vidros temperados'] },
                      { category: 'Cobertura', items: ['Telhas cerâmicas', 'Estrutura madeira', 'Manta térmica'] }
                    ].map((category, index) => (
                      <div key={index} className="bg-surface p-4 rounded-lg">
                        <h5 className="font-semibold text-foreground mb-2">{category.category}</h5>
                        <ul className="text-sm text-text-secondary space-y-1">
                          {category.items.map((item, i) => (
                            <li key={i}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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

            {/* Actions */}
            <Card className="card-elevated">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Button onClick={onStartNew} className="w-full btn-primary">
                    <Home className="mr-2 w-4 h-4" />
                    Nova Planta Baixa
                  </Button>
                  
                  <Button variant="outline" className="w-full btn-secondary">
                    <Eye className="mr-2 w-4 h-4" />
                    Visualizar 3D
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};