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
    style: "moderno_minimalista"
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

const DimensionsStep = ({ data, updateData }: { data: FloorPlanData; updateData: (updates: Partial<FloorPlanData>) => void }) => (
  <div className="grid md:grid-cols-2 gap-8">
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium text-foreground mb-3 block">
          Área Total da Casa (m²)
        </Label>
        <Input
          type="number"
          value={data.totalArea}
          onChange={(e) => updateData({ totalArea: Number(e.target.value) })}
          className="input-apple text-lg"
          min={80}
          max={150}
        />
        <p className="text-sm text-text-tertiary mt-2">Entre 80 e 150 m²</p>
      </div>
    </div>
    
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium text-foreground mb-3 block">
          Largura do Terreno (m)
        </Label>
        <Input
          type="number"
          value={data.lotWidth}
          onChange={(e) => updateData({ lotWidth: Number(e.target.value) })}
          className="input-apple text-lg"
          min={8}
          max={20}
        />
      </div>
      
      <div>
        <Label className="text-base font-medium text-foreground mb-3 block">
          Profundidade do Terreno (m)
        </Label>
        <Input
          type="number"
          value={data.lotDepth}
          onChange={(e) => updateData({ lotDepth: Number(e.target.value) })}
          className="input-apple text-lg"
          min={15}
          max={30}
        />
      </div>
    </div>
  </div>
);

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