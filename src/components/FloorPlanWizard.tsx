import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Check, Home, Users, Bath, Car } from "lucide-react";
import { toast } from "sonner";

interface FloorPlanWizardProps {
  onBack: () => void;
  onComplete: (data: FloorPlanData) => void;
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
  windows?: Array<{
    room: string;
    type: 'normal' | 'basculante';
    width: number;
    height: number;
    sillHeight: number;
    quantity: number;
  }>;
}

const STEPS = [
  { id: 'dimensions', title: 'Dimensões', icon: Home },
  { id: 'program', title: 'Programa', icon: Users },
  { id: 'extras', title: 'Extras', icon: Bath },
  { id: 'style', title: 'Estilo', icon: Car }
];

export const FloorPlanWizard = ({ onBack, onComplete }: FloorPlanWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<FloorPlanData>({
    totalArea: 120,
    lotWidth: 12,
    lotDepth: 20,
    bedrooms: 3,
    bathrooms: 2,
    hasGarage: true,
    hasBalcony: true,
    style: "moderno_minimalista",
    windows: [
      { room: "Sala de Estar", type: "normal", width: 1.2, height: 1.2, sillHeight: 1.0, quantity: 1 },
      { room: "Quarto Master", type: "normal", width: 1.0, height: 1.2, sillHeight: 1.0, quantity: 1 },
      { room: "Quarto 2", type: "normal", width: 1.0, height: 1.2, sillHeight: 1.0, quantity: 1 },
      { room: "Cozinha", type: "basculante", width: 0.6, height: 0.6, sillHeight: 1.6, quantity: 1 },
      { room: "Banheiro Social", type: "basculante", width: 0.6, height: 0.6, sillHeight: 1.6, quantity: 1 }
    ]
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(data);
      toast.success("Planta baixa gerada com sucesso!");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const updateData = (updates: Partial<FloorPlanData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-foreground mb-4">
            Configure Sua Planta Baixa
          </h1>
          <p className="text-xl text-text-secondary">
            Defina as especificações da sua residência
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200
                    ${isActive ? 'bg-primary text-primary-foreground shadow-lg' : 
                      isCompleted ? 'bg-success text-white' : 'bg-surface border border-border'}
                  `}>
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  
                  {index < STEPS.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 transition-colors ${
                      isCompleted ? 'bg-success' : 'bg-border'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="card-elevated mb-8">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-semibold text-foreground">
              {STEPS[currentStep].title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pb-8">
            {currentStep === 0 && (
              <DimensionsStep data={data} updateData={updateData} />
            )}
            {currentStep === 1 && (
              <ProgramStep data={data} updateData={updateData} />
            )}
            {currentStep === 2 && (
              <ExtrasStep data={data} updateData={updateData} />
            )}
            {currentStep === 3 && (
              <StyleStep data={data} updateData={updateData} />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            onClick={handlePrevious}
            variant="ghost" 
            className="btn-ghost"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            {currentStep === 0 ? 'Voltar' : 'Anterior'}
          </Button>
          
          <Button 
            onClick={handleNext}
            className="btn-primary"
          >
            {currentStep === STEPS.length - 1 ? 'Gerar Planta' : 'Próximo'}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const DimensionsStep = ({ data, updateData }: { data: FloorPlanData; updateData: (updates: Partial<FloorPlanData>) => void }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const handleQuickEdit = (field: string, value: number) => {
    updateData({ [field]: value });
    setIsEditing(null);
  };

  return (
    <div className="space-y-8">
      {/* Área Total */}
      <div className="glass-card p-6">
        <Label className="text-base font-medium text-foreground mb-4 block flex items-center">
          <Home className="w-5 h-5 mr-2" />
          Área Total da Casa
        </Label>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[80, 100, 120, 150].map(area => (
            <Button
              key={area}
              variant={data.totalArea === area ? "default" : "outline"}
              onClick={() => updateData({ totalArea: area })}
              className={`h-12 ${data.totalArea === area ? "btn-primary" : "btn-secondary"}`}
            >
              {area}m²
            </Button>
          ))}
        </div>
        
        <div className="flex items-center space-x-4">
          <Input
            type="number"
            value={data.totalArea}
            onChange={(e) => updateData({ totalArea: Number(e.target.value) })}
            className="input-apple text-lg max-w-32"
            min={80}
            max={150}
            step={5}
          />
          <span className="text-text-secondary">m² (Entre 80 e 150 m²)</span>
        </div>
      </div>

      {/* Dimensões do Terreno */}
      <div className="glass-card p-6">
        <Label className="text-base font-medium text-foreground mb-4 block flex items-center">
          <ArrowRight className="w-5 h-5 mr-2" />
          Dimensões do Terreno
        </Label>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label className="text-sm text-text-secondary mb-2 block">Largura (m)</Label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[8, 10, 12, 15, 20].map(width => (
                <Button
                  key={width}
                  variant="ghost"
                  size="sm"
                  onClick={() => updateData({ lotWidth: width })}
                  className={`text-xs ${data.lotWidth === width ? "bg-primary-light text-primary" : ""}`}
                >
                  {width}m
                </Button>
              ))}
            </div>
            <Input
              type="number"
              value={data.lotWidth}
              onChange={(e) => updateData({ lotWidth: Number(e.target.value) })}
              className="input-apple"
              min={8}
              max={20}
              step={0.5}
            />
          </div>
          
          <div>
            <Label className="text-sm text-text-secondary mb-2 block">Profundidade (m)</Label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[15, 20, 25, 30].map(depth => (
                <Button
                  key={depth}
                  variant="ghost"
                  size="sm"
                  onClick={() => updateData({ lotDepth: depth })}
                  className={`text-xs ${data.lotDepth === depth ? "bg-primary-light text-primary" : ""}`}
                >
                  {depth}m
                </Button>
              ))}
            </div>
            <Input
              type="number"
              value={data.lotDepth}
              onChange={(e) => updateData({ lotDepth: Number(e.target.value) })}
              className="input-apple"
              min={15}
              max={30}
              step={0.5}
            />
          </div>
        </div>

        {/* Preview Visual */}
        <div className="mt-6 p-4 bg-surface rounded-xl">
          <p className="text-sm text-text-secondary mb-3">Preview das Dimensões:</p>
          <div className="flex items-center justify-center">
            <div 
              className="border-2 border-dashed border-primary bg-primary-light/20 rounded-lg flex items-center justify-center relative"
              style={{
                width: Math.min(200, data.lotWidth * 8) + 'px',
                height: Math.min(150, data.lotDepth * 5) + 'px'
              }}
            >
              <div className="text-xs text-primary font-medium">
                {data.lotWidth}m × {data.lotDepth}m
                <br />
                <span className="text-text-tertiary">{data.totalArea}m² área</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProgramStep = ({ data, updateData }: { data: FloorPlanData; updateData: (updates: Partial<FloorPlanData>) => void }) => (
  <div className="grid md:grid-cols-2 gap-8">
    <div>
      <Label className="text-base font-medium text-foreground mb-3 block">
        Número de Quartos
      </Label>
      <div className="grid grid-cols-2 gap-3">
        {[2, 3].map(num => (
          <Button
            key={num}
            variant={data.bedrooms === num ? "default" : "outline"}
            onClick={() => updateData({ bedrooms: num })}
            className={data.bedrooms === num ? "btn-primary" : "btn-secondary"}
          >
            {num} Quartos
          </Button>
        ))}
      </div>
      <p className="text-sm text-text-tertiary mt-2">
        {data.bedrooms === 3 ? "Inclui 1 suíte master" : "2 quartos + 1 banheiro social"}
      </p>
    </div>
    
    <div>
      <Label className="text-base font-medium text-foreground mb-3 block">
        Número de Banheiros
      </Label>
      <div className="grid grid-cols-2 gap-3">
        {[2, 3].map(num => (
          <Button
            key={num}
            variant={data.bathrooms === num ? "default" : "outline"}
            onClick={() => updateData({ bathrooms: num })}
            className={data.bathrooms === num ? "btn-primary" : "btn-secondary"}
          >
            {num} Banheiros
          </Button>
        ))}
      </div>
    </div>
  </div>
);

const ExtrasStep = ({ data, updateData }: { data: FloorPlanData; updateData: (updates: Partial<FloorPlanData>) => void }) => (
  <div className="space-y-8">
    <div className="grid md:grid-cols-2 gap-6">
      <OptionCard
        title="Garagem"
        description="Garagem coberta para 1 veículo"
        selected={data.hasGarage}
        onToggle={() => updateData({ hasGarage: !data.hasGarage })}
      />
      
      <OptionCard
        title="Varanda/Terraço"
        description="Área externa coberta de lazer"
        selected={data.hasBalcony}
        onToggle={() => updateData({ hasBalcony: !data.hasBalcony })}
      />
    </div>
  </div>
);

const StyleStep = ({ data, updateData }: { data: FloorPlanData; updateData: (updates: Partial<FloorPlanData>) => void }) => {
  const styles = [
    { id: "moderno_minimalista", name: "Moderno Minimalista", description: "Linhas clean e espaços integrados" },
    { id: "tradicional_brasileiro", name: "Tradicional Brasileiro", description: "Estilo clássico com varanda e telha cerâmica" },
    { id: "contemporaneo_sustentavel", name: "Contemporâneo Sustentável", description: "Design moderno com foco em eficiência" }
  ];

  return (
    <div className="space-y-6">
      {styles.map(style => (
        <StyleCard
          key={style.id}
          name={style.name}
          description={style.description}
          selected={data.style === style.id}
          onSelect={() => updateData({ style: style.id })}
        />
      ))}
    </div>
  );
};

const OptionCard = ({ title, description, selected, onToggle }: {
  title: string;
  description: string;
  selected: boolean;
  onToggle: () => void;
}) => (
  <div 
    onClick={onToggle}
    className={`
      p-6 rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-md
      ${selected ? 'border-primary bg-primary-light' : 'border-border bg-surface hover:bg-surface-hover'}
    `}
  >
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <div className={`
        w-5 h-5 rounded-full border-2 transition-all duration-200
        ${selected ? 'border-primary bg-primary' : 'border-border'}
      `}>
        {selected && <Check className="w-3 h-3 text-primary-foreground mx-auto mt-0.5" />}
      </div>
    </div>
    <p className="text-text-secondary text-sm">{description}</p>
  </div>
);

const StyleCard = ({ name, description, selected, onSelect }: {
  name: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) => (
  <div 
    onClick={onSelect}
    className={`
      p-6 rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-md
      ${selected ? 'border-primary bg-primary-light' : 'border-border bg-surface hover:bg-surface-hover'}
    `}
  >
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-foreground mb-1">{name}</h3>
        <p className="text-text-secondary text-sm">{description}</p>
      </div>
      <div className={`
        w-6 h-6 rounded-full border-2 transition-all duration-200
        ${selected ? 'border-primary bg-primary' : 'border-border'}
      `}>
        {selected && <Check className="w-4 h-4 text-primary-foreground mx-auto mt-0.5" />}
      </div>
    </div>
  </div>
);