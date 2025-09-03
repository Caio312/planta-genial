import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { FloorPlanWizard } from "@/components/FloorPlanWizard";
import { FloorPlanSpecifications } from "@/components/FloorPlanSpecifications";
import { ThemeToggle } from "@/components/ThemeToggle";

type AppState = 'hero' | 'wizard' | 'specifications';

interface FloorPlanData {
  totalArea: number;
  lotWidth: number;
  lotDepth: number;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  hasGarage: boolean;
  hasBalcony: boolean;
  hasOffice: boolean;
  hasLaundry: boolean;
  style: string;
  livingStyle: 'integrated' | 'separated';
  drawingStyle: 'technical_2d' | 'humanized_2d' | 'isometric_3d';
  generatedImageUrl?: string;
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
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
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