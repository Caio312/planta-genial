export interface FloorPlanSpecifications {
  wallExternal?: number;
  wallInternal?: number;
  minBedroomCoupleArea?: number;
  minBedroomSingleArea?: number;
  minBedroomCoupleWidth?: number;
  minBedroomSingleWidth?: number;
  minLivingArea?: number;
  minLivingWidth?: number;
  minKitchenWidth?: number;
  minBathroomArea?: number;
  bathroomCircleDiameter?: number;
  accessibleCircleDiameter?: number;
  ceilingMin?: number;
  shortCeilingMin?: number;
  doorEntrance?: number;
  doorRoom?: number;
  doorBath?: number;
  corridorWidth?: number;
  windowFractionLighting?: number;
  windowFractionVent?: number;
}

// helper to merge com defaults (opcional)
export const defaultSpecs: Required<FloorPlanSpecifications> = {
  wallExternal: 0.15,
  wallInternal: 0.10,
  minBedroomCoupleArea: 8.0,
  minBedroomSingleArea: 6.0,
  minBedroomCoupleWidth: 2.8,
  minBedroomSingleWidth: 2.2,
  minLivingArea: 10.0,
  minLivingWidth: 2.5,
  minKitchenWidth: 1.8,
  minBathroomArea: 2.5,
  bathroomCircleDiameter: 0.9,
  accessibleCircleDiameter: 1.5,
  ceilingMin: 2.5,
  shortCeilingMin: 2.3,
  doorEntrance: 0.8,
  doorRoom: 0.7,
  doorBath: 0.6,
  corridorWidth: 0.9,
  windowFractionLighting: 1/8,
  windowFractionVent: 1/16
};

export function mergeSpecs(override?: FloorPlanSpecifications) {
  return { ...defaultSpecs, ...(override || {}) } as Required<FloorPlanSpecifications>;
}