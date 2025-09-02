import { enforceConstraints } from '@/lib/constraints';
import { FloorPlanSpecifications, mergeSpecs } from '@/lib/specifications';

export type RoomType = 'bedroom' | 'bathroom' | 'living' | 'kitchen' | 'garage' | 'balcony' | 'service' | 'other';

export interface Room {
  id: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  type: RoomType;
  windows?: Array<{ width?: number; height?: number; x?: number; y?: number }>;
  doors?: Array<{ width?: number; x?: number; y?: number }>;
  wallThickness?: number;
}

export interface FloorPlanData {
  lotWidth: number;
  lotDepth: number;
  bedrooms: number;
  totalArea?: number;
}

export interface ConstraintResult {
  rooms: Room[];
  warnings: string[];
  conflicts?: string[];
}

const DEFAULTS = {
  wallExternal: 0.15,
  wallInternal: 0.10,
  min: {
    bedroomCoupleArea: 8.0,
    bedroomSingleArea: 6.0,
    bedroomCoupleWidth: 2.8,
    bedroomSingleWidth: 2.2,
    livingArea: 10.0,
    livingWidth: 2.5,
    kitchenWidth: 1.8,
    bathroomArea: 2.5,
    bathroomCircleDiameter: 0.9,
    accessibleCircleDiameter: 1.5,
    ceilingMin: 2.5,
    shortCeilingMin: 2.3,
    doorEntrance: 0.8,
    doorRoom: 0.7,
    doorBath: 0.6,
    corridorWidth: 0.9
  },
  windowFractionLighting: 1 / 8,
  windowFractionVent: 1 / 16
};

function snap(v: number, g = 0.05) { return Math.round(v / g) * g; }

function applyWallThickness(rooms: Room[]) {
  return rooms.map(r => ({ ...r, wallThickness: r.wallThickness ?? (r.type === 'living' || r.type === 'bedroom' ? DEFAULTS.wallExternal : DEFAULTS.wallInternal) }));
}

function ensureMinDimensions(rooms: Room[], data: FloorPlanData, warnings: string[]) {
  return rooms.map(r => {
    const out = { ...r };
    const area = out.width * out.height;
    if (out.type === 'bedroom') {
      const isCouple = out.name.toLowerCase().includes('casal') || out.width >= DEFAULTS.min.bedroomCoupleWidth;
      const minArea = isCouple ? DEFAULTS.min.bedroomCoupleArea : DEFAULTS.min.bedroomSingleArea;
      const minWidth = isCouple ? DEFAULTS.min.bedroomCoupleWidth : DEFAULTS.min.bedroomSingleWidth;
      if (area < minArea || out.width < minWidth) {
        const neededW = Math.max(out.width, minWidth);
        const neededH = Math.max(out.height, Math.max(minArea / neededW, out.height));
        out.width = snap(neededW);
        out.height = snap(neededH);
        warnings.push(`Ajustado "${out.name}" para dimensões mínimas (${out.width}x${out.height} m).`);
      }
    } else if (out.type === 'living') {
      if (area < DEFAULTS.min.livingArea || out.width < DEFAULTS.min.livingWidth) {
        const neededW = Math.max(out.width, DEFAULTS.min.livingWidth);
        const neededH = Math.max(out.height, Math.max(DEFAULTS.min.livingArea / neededW, out.height));
        out.width = snap(neededW);
        out.height = snap(neededH);
        warnings.push(`Ajustado "${out.name}" para área mínima social (${out.width}x${out.height} m).`);
      }
    } else if (out.type === 'kitchen') {
      if (out.width < DEFAULTS.min.kitchenWidth) {
        out.width = snap(DEFAULTS.min.kitchenWidth);
        warnings.push(`Largura da cozinha "${out.name}" ajustada para ${out.width} m (mín ${DEFAULTS.min.kitchenWidth} m).`);
      }
    } else if (out.type === 'bathroom') {
      const minArea = DEFAULTS.min.bathroomArea;
      if (area < minArea) {
        const neededH = Math.max(out.height, minArea / Math.max(0.1, out.width));
        out.height = snap(neededH);
        warnings.push(`Banheiro "${out.name}" ajustado para área mínima ${out.width}x${out.height} m.`);
      }
    }
    return out;
  });
}

function ensureDoors(rooms: Room[], warnings: string[]) {
  return rooms.map(r => {
    const copy = { ...r };
    (copy.doors || []).forEach((door, i) => {
      const minW = doorMinForRoom(copy.type);
      if (!door.width || door.width < minW) {
        door.width = minW;
        warnings.push(`Porta ${i + 1} em "${copy.name}" ajustada para ${minW.toFixed(2)} m.`);
      }
    });
    return copy;
  });

  function doorMinForRoom(type: RoomType) {
    if (type === 'bathroom') return DEFAULTS.min.doorBath;
    if (type === 'living') return DEFAULTS.min.doorRoom;
    return DEFAULTS.min.doorRoom;
  }
}

function ensureWindows(rooms: Room[], warnings: string[]) {
  return rooms.map(r => {
    const copy = { ...r };
    const area = copy.width * copy.height;
    const currentWindowArea = (copy.windows || []).reduce((s, w) => s + (w.width || 0) * (w.height || 0), 0);
    const minLightArea = Math.max(0.01, area * DEFAULTS.windowFractionLighting);
    if (currentWindowArea < minLightArea) {
      const need = minLightArea - currentWindowArea;
      const winW = Math.min(copy.width - 0.2, Math.max(0.5, Math.sqrt(need * 1.5)));
      const winH = Math.min(1.2, Math.max(0.12, need / Math.max(0.001, winW)));
      copy.windows = copy.windows ? copy.windows.concat([{ width: winW, height: winH }]) : [{ width: winW, height: winH }];
      warnings.push(`Adicionada janela em "${copy.name}" (~${(winW * winH).toFixed(2)} m²) para iluminação mínima.`);
    }
    return copy;
  });
}

function enforceZoning(rooms: Room[], data: FloorPlanData, warnings: string[]) {
  const social = rooms.filter(r => r.type === 'living' || r.type === 'other').slice();
  const service = rooms.filter(r => r.type === 'kitchen' || r.type === 'service' || r.type === 'garage');
  const priv = rooms.filter(r => r.type === 'bedroom' || r.type === 'bathroom');

  let x = 1, y = 1;
  social.forEach(r => { r.x = snap(x); r.y = snap(y); y += r.height + 0.2; });
  x += (social.reduce((m, r) => Math.max(m, r.width), 0) + 0.5);
  let sy = 1;
  service.forEach(r => { r.x = snap(x); r.y = snap(sy); sy += r.height + 0.2; });
  let px = 1, py = Math.max(y, sy) + 0.4;
  priv.forEach(r => { r.x = snap(px); r.y = snap(py); px += r.width + 0.2; });

  warnings.push('Aplicado zoneamento lógico (social / serviço / privativa).');
  return rooms;
}

function groupWetAreas(rooms: Room[], warnings: string[]) {
  const wets = rooms.filter(r => r.type === 'kitchen' || r.type === 'bathroom' || r.type === 'service' || r.type === 'garage');
  if (wets.length <= 1) return rooms;
  const avgX = wets.reduce((s, r) => s + r.x, 0) / wets.length;
  wets.forEach((r, i) => { r.x = snap(avgX + i * 0.1); });
  warnings.push('Agrupadas áreas molhadas para simplificar instalações hidráulicas.');
  return rooms;
}

function alignWalls(rooms: Room[], warnings: string[]) {
  const EPS = 0.12;
  const xs: number[] = [];
  rooms.forEach(r => { xs.push(r.x, r.x + r.width); });
  const uniqXs = Array.from(new Set(xs.map(x => snap(x, 0.01)))).sort((a,b)=>a-b);
  for (let i=0;i<uniqXs.length-1;i++){
    if (Math.abs(uniqXs[i+1]-uniqXs[i]) < EPS) {
      const m = (uniqXs[i]+uniqXs[i+1])/2;
      uniqXs[i] = m; uniqXs[i+1] = m;
    }
  }
  rooms.forEach(r => {
    const left = nearest(uniqXs, r.x); const right = nearest(uniqXs, r.x + r.width);
    r.x = snap(left);
    r.width = snap(Math.max(0.5, right - left));
  });
  warnings.push('Alinhadas paredes em grid estrutural simplificado.');
  return rooms;

  function nearest(arr:number[], v:number){
    let best = arr[0], bd = Math.abs(arr[0]-v);
    arr.forEach(a => { const d = Math.abs(a - v); if (d < bd) { bd = d; best = a; } });
    return best;
  }
}

/* --- funções adicionadas para regras específicas --- */

function ensureBathroomClearance(rooms: Room[], warnings: string[], conflicts: string[]) {
  return rooms.map(r => {
    if (r.type !== 'bathroom') return r;
    const diameter = DEFAULTS.min.bathroomCircleDiameter;
    if (r.width < diameter || r.height < diameter) {
      const needW = Math.max(r.width, diameter);
      const needH = Math.max(r.height, diameter);
      if (needW > 6 || needH > 6) {
        conflicts.push(`Banheiro "${r.name}" requer giro de ${diameter}m e não pôde ser ajustado automaticamente.`);
        return r;
      }
      r.width = snap(needW);
      r.height = snap(needH);
      warnings.push(`Ajustado "${r.name}" para permitir giro de ${diameter}m.`);
    }
    return r;
  });
}

function ensureBedroomFreeWall(rooms: Room[], warnings: string[], conflicts: string[]) {
  return rooms.map(r => {
    if (r.type !== 'bedroom') return r;
    const minFree = 2.6;
    const maxEdge = Math.max(r.width, r.height);
    if (maxEdge < minFree) {
      const need = minFree;
      if (need > 8) {
        conflicts.push(`Quarto "${r.name}" não tem parede livre suficiente e não pode ser ajustado automaticamente.`);
        return r;
      }
      if (r.width >= r.height) r.width = snap(need);
      else r.height = snap(need);
      warnings.push(`Ajustado "${r.name}" para ter parede livre >= ${minFree}m.`);
    }
    return r;
  });
}

function enforceKitchenAdjacency(rooms: Room[], warnings: string[]) {
  const kitchen = rooms.find(r => r.type === 'kitchen');
  const social = rooms.find(r => r.type === 'living' || r.type === 'other');
  if (!kitchen || !social) return rooms;
  const kCenter = { x: kitchen.x + kitchen.width / 2, y: kitchen.y + kitchen.height / 2 };
  const sCenter = { x: social.x + social.width / 2, y: social.y + social.height / 2 };
  const dx = Math.abs(kCenter.x - sCenter.x);
  if (dx > 2.0) {
    kitchen.x = snap(social.x + social.width + 0.2);
    kitchen.y = snap(social.y);
    warnings.push(`Cozinha "${kitchen.name}" reposicionada próxima à área social.`);
  }
  return rooms;
}

/* --- função principal --- */
export function enforceConstraints(initialRooms: Room[], data: FloorPlanData): ConstraintResult {
  const warnings: string[] = [];
  const conflicts: string[] = [];
  let rooms = initialRooms.map(r => ({ ...r }));
  rooms = applyWallThickness(rooms);
  rooms = ensureMinDimensions(rooms, data, warnings);
  rooms = ensureDoors(rooms, warnings);
  rooms = ensureWindows(rooms, warnings);
  rooms = ensureBathroomClearance(rooms, warnings, conflicts);
  rooms = ensureBedroomFreeWall(rooms, warnings, conflicts);
  rooms = enforceZoning(rooms, data, warnings);
  rooms = enforceKitchenAdjacency(rooms, warnings);
  rooms = groupWetAreas(rooms, warnings);
  rooms = alignWalls(rooms, warnings);

  rooms = rooms.map(r => ({
    ...r,
    x: Math.max(0.1, snap(r.x, 0.01)),
    y: Math.max(0.1, snap(r.y, 0.01)),
    width: Math.max(0.5, snap(r.width, 0.01)),
    height: Math.max(0.5, snap(r.height, 0.01))
  }));

  const result: ConstraintResult = { rooms, warnings };
  if (conflicts.length) {
    result.conflicts = conflicts;
    conflicts.forEach(c => warnings.push(`CONFLITO: ${c}`));
  }
  return result;
}

const generateFloorPlan = () => {
  // ... implementação da função de geração de planta baixa
};