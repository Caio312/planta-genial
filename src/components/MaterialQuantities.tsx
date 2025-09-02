import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calculator, Download, Search, TrendingUp } from 'lucide-react';
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

interface MaterialItem {
  id: string;
  category: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specification: string;
}

interface MaterialQuantitiesProps {
  data: FloorPlanData;
}

export const MaterialQuantities = ({ data }: MaterialQuantitiesProps) => {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    calculateQuantities();
  }, [data]);

  const calculateQuantities = async () => {
    setLoading(true);

    try {
      // Simulate API call to fetch current material prices
      await new Promise(resolve => setTimeout(resolve, 1500));

      const calculatedMaterials: MaterialItem[] = [];

      // ESTRUTURA
      const concreteVolume = (data.totalArea * 0.12) + (data.totalArea * 0.03); // Laje + fundação
      calculatedMaterials.push({
        id: 'concrete',
        category: 'Estrutura',
        name: 'Concreto Usinado FCK 25',
        unit: 'm³',
        quantity: parseFloat(concreteVolume.toFixed(2)),
        unitPrice: 380,
        totalPrice: concreteVolume * 380,
        specification: 'Bombeado, com aditivo plastificante'
      });

      const steelWeight = data.totalArea * 8; // kg/m²
      calculatedMaterials.push({
        id: 'steel',
        category: 'Estrutura',
        name: 'Aço CA-50',
        unit: 'kg',
        quantity: parseFloat(steelWeight.toFixed(0)),
        unitPrice: 6.50,
        totalPrice: steelWeight * 6.50,
        specification: 'Barras de 6mm a 20mm, dobrado e cortado'
      });

      // ALVENARIA E VEDAÇÃO
      const externalWallArea = (2 * data.lotWidth + 2 * data.lotDepth) * 3; // Perímetro × altura
      const internalWallArea = data.totalArea * 0.8; // Estimativa paredes internas
      const totalWallArea = externalWallArea + internalWallArea;

      calculatedMaterials.push({
        id: 'blocks',
        category: 'Alvenaria',
        name: 'Bloco Cerâmico 14x19x39cm',
        unit: 'und',
        quantity: Math.ceil(totalWallArea * 12.5),
        unitPrice: 1.85,
        totalPrice: Math.ceil(totalWallArea * 12.5) * 1.85,
        specification: 'Furos horizontais, classe 2,5MPa'
      });

      // COBERTURA
      const roofArea = data.totalArea * 1.3; // Área de telhado com inclinação
      calculatedMaterials.push({
        id: 'roof_tiles',
        category: 'Cobertura',
        name: 'Telha Cerâmica Portuguesa',
        unit: 'm²',
        quantity: parseFloat(roofArea.toFixed(2)),
        unitPrice: 28.50,
        totalPrice: roofArea * 28.50,
        specification: 'Cor natural, primeira qualidade'
      });

      calculatedMaterials.push({
        id: 'roof_structure',
        category: 'Cobertura',
        name: 'Madeira para Estrutura do Telhado',
        unit: 'm³',
        quantity: parseFloat((roofArea * 0.04).toFixed(2)),
        unitPrice: 2800,
        totalPrice: roofArea * 0.04 * 2800,
        specification: 'Madeira tratada, seção variada'
      });

      // REVESTIMENTOS
      const floorArea = data.totalArea;
      calculatedMaterials.push({
        id: 'ceramic_floor',
        category: 'Revestimentos',
        name: 'Piso Cerâmico 60x60cm',
        unit: 'm²',
        quantity: parseFloat(floorArea.toFixed(2)),
        unitPrice: 45.80,
        totalPrice: floorArea * 45.80,
        specification: 'Retificado, PEI 4, antiderrapante'
      });

      const wallTileArea = data.bathrooms * 25 + 15; // Banheiros + cozinha
      calculatedMaterials.push({
        id: 'wall_tiles',
        category: 'Revestimentos',
        name: 'Revestimento Cerâmico 30x60cm',
        unit: 'm²',
        quantity: parseFloat(wallTileArea.toFixed(2)),
        unitPrice: 38.90,
        totalPrice: wallTileArea * 38.90,
        specification: 'Brilhante, primeira qualidade'
      });

      // PINTURA
      const paintArea = totalWallArea * 2; // Duas demãos
      calculatedMaterials.push({
        id: 'paint',
        category: 'Pintura',
        name: 'Tinta Acrílica Premium',
        unit: 'l',
        quantity: Math.ceil(paintArea / 12),
        unitPrice: 85.00,
        totalPrice: Math.ceil(paintArea / 12) * 85.00,
        specification: 'Lavável, cor branco gelo'
      });

      // ESQUADRIAS
      const windowsQty = data.bedrooms + 2 + data.bathrooms; // Quartos + sala/cozinha + banheiros
      calculatedMaterials.push({
        id: 'windows',
        category: 'Esquadrias',
        name: 'Janelas de Alumínio',
        unit: 'und',
        quantity: windowsQty,
        unitPrice: 420.00,
        totalPrice: windowsQty * 420.00,
        specification: 'Vidro temperado, ferragens incluídas'
      });

      const doorsQty = data.bedrooms + data.bathrooms + 2; // Quartos + banheiros + entrada + serviços
      calculatedMaterials.push({
        id: 'doors',
        category: 'Esquadrias',
        name: 'Portas de Madeira',
        unit: 'und',
        quantity: doorsQty,
        unitPrice: 320.00,
        totalPrice: doorsQty * 320.00,
        specification: 'Madeira maciça, com batente e ferragens'
      });

      // INSTALAÇÕES
      const electricalPoints = data.totalArea * 1.2; // Pontos por m²
      calculatedMaterials.push({
        id: 'electrical',
        category: 'Instalações',
        name: 'Material Elétrico Completo',
        unit: 'ponto',
        quantity: Math.ceil(electricalPoints),
        unitPrice: 85.00,
        totalPrice: Math.ceil(electricalPoints) * 85.00,
        specification: 'Fios, disjuntores, tomadas, interruptores'
      });

      const plumbingPoints = data.bathrooms * 8 + 6; // Banheiros + cozinha/área serviço
      calculatedMaterials.push({
        id: 'plumbing',
        category: 'Instalações',
        name: 'Material Hidráulico',
        unit: 'ponto',
        quantity: plumbingPoints,
        unitPrice: 120.00,
        totalPrice: plumbingPoints * 120.00,
        specification: 'Tubos PVC, conexões, registros, louças básicas'
      });

      setMaterials(calculatedMaterials);
      
      const total = calculatedMaterials.reduce((sum, item) => sum + item.totalPrice, 0);
      setTotalCost(total);
      
      toast.success("Quantitativos calculados com preços atualizados!");

    } catch (error) {
      toast.error("Erro ao calcular quantitativos");
    } finally {
      setLoading(false);
    }
  };

  const groupedMaterials = materials.reduce((groups, material) => {
    const category = material.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(material);
    return groups;
  }, {} as Record<string, MaterialItem[]>);

  const handleExportQuantities = () => {
    // Generate CSV content
    const csvContent = [
      ['Categoria', 'Material', 'Unidade', 'Quantidade', 'Preço Unit.', 'Total', 'Especificação'],
      ...materials.map(item => [
        item.category,
        item.name,
        item.unit,
        item.quantity.toString(),
        `R$ ${item.unitPrice.toFixed(2)}`,
        `R$ ${item.totalPrice.toFixed(2)}`,
        item.specification
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantitativos-${Date.now()}.csv`;
    a.click();
    
    toast.success("Quantitativos exportados!");
  };

  if (loading) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="w-5 h-5 mr-2 animate-spin" />
            Calculando Quantitativos...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-surface animate-pulse rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Quantitativos de Materiais
            </div>
            <Button onClick={handleExportQuantities} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-surface rounded-xl">
              <div className="text-2xl font-bold text-foreground">
                R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-text-secondary">Custo Total</div>
            </div>
            <div className="text-center p-4 bg-surface rounded-xl">
              <div className="text-2xl font-bold text-foreground">
                R$ {(totalCost / data.totalArea).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-text-secondary">por m²</div>
            </div>
            <div className="text-center p-4 bg-surface rounded-xl">
              <div className="text-2xl font-bold text-foreground">
                {materials.length}
              </div>
              <div className="text-sm text-text-secondary">Itens</div>
            </div>
            <div className="text-center p-4 bg-surface rounded-xl">
              <div className="text-2xl font-bold text-primary flex items-center justify-center">
                <TrendingUp className="w-5 h-5 mr-1" />
                Atual
              </div>
              <div className="text-sm text-text-secondary">Preços Online</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials by Category */}
      <div className="space-y-6">
        {Object.entries(groupedMaterials).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-surface rounded-xl">
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{item.name}</div>
                      <div className="text-sm text-text-secondary">{item.specification}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {item.quantity} {item.unit}
                      </div>
                      <div className="text-sm text-text-secondary">
                        R$ {item.unitPrice.toFixed(2)} / {item.unit}
                      </div>
                    </div>
                    <div className="ml-6 text-right">
                      <div className="font-bold text-lg text-foreground">
                        R$ {item.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};