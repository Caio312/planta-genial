import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { FloorPlanWizard } from "@/components/FloorPlanWizard";
import { FloorPlanSpecifications } from "@/components/FloorPlanSpecifications";

type AppState = 'hero' | 'wizard' | 'specifications';

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

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>('hero');
  const [floorPlanData, setFloorPlanData] = useState<FloorPlanData | null>(null);

  const handleGetStarted = () => {
    setCurrentState('wizard');
  };

  const handleWizardBack = () => {
    setCurrentState('hero');
  };

  const handleWizardComplete = (data: FloorPlanData) => {
    setFloorPlanData(data);
    setCurrentState('specifications');
  };

  const handleSpecificationsBack = () => {
    setCurrentState('wizard');
  };

  const handleStartNew = () => {
    setFloorPlanData(null);
    setCurrentState('hero');
  };

  return (
    <>
      {currentState === 'hero' && (
        <HeroSection onGetStarted={handleGetStarted} />
      )}
      
      {currentState === 'wizard' && (
        <FloorPlanWizard 
          onBack={handleWizardBack}
          onComplete={handleWizardComplete}
        />
      )}
      
      {currentState === 'specifications' && floorPlanData && (
        <FloorPlanSpecifications
          data={floorPlanData}
          onBack={handleSpecificationsBack}
          onStartNew={handleStartNew}
        />
      )}
    </>
  );
};

export default Index;