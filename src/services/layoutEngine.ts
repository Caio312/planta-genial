/**
 * Motor de layout arquitetônico com múltiplos padrões e validação NBR 15575.
 * Áreas mínimas (NBR 15575 / Código de Obras típico):
 * - Dormitório principal (casal): ≥ 8,0 m² | mínimo aceitável: 9 m²
 * - Dormitório (solteiro): ≥ 7,0 m² | mínimo aceitável: 8 m²
 * - Sala estar: ≥ 10,0 m²
 * - Cozinha: ≥ 4,0 m² (idealmente 6 m²)
 * - Banheiro: ≥ 2,0 m² (idealmente 3 m²)
 * - Área de serviço: ≥ 1,5 m²
 * - Circulação: largura mínima 0,80 m (idealmente 1,10 m)
 * - Pé direito: 2,50 m (mínimo NBR)
 */

export type RoomType =
  | 'bedroom' | 'suite' | 'bathroom' | 'living' | 'kitchen'
  | 'service' | 'garage' | 'balcony' | 'circulation' | 'office';

export interface Window { x: number; y: number; width: number; type: 'normal' | 'basculante'; wall: 'top' | 'bottom' | 'left' | 'right'; }
export interface Door { x: number; y: number; width: number; wall: 'top' | 'bottom' | 'left' | 'right'; swing: 'in' | 'out'; }

export interface Room {
  id: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  type: RoomType;
  windows?: Window[];
  doors?: Door[];
}

export interface LayoutInput {
  totalArea: number;
  lotWidth: number;
  lotDepth: number;
  bedrooms: number;
  bathrooms: number;
  hasGarage: boolean;
  hasBalcony: boolean;
  hasOffice?: boolean;
}

export type LayoutPattern = 'linear' | 'central_corridor' | 'L_shape' | 'compact';

export const PATTERN_LABELS: Record<LayoutPattern, string> = {
  linear: 'Linear (frente-fundo)',
  central_corridor: 'Corredor central',
  L_shape: 'Em L',
  compact: 'Compacto',
};

/* ---------------- Validação NBR ---------------- */

export interface NBRIssue {
  level: 'error' | 'warn';
  message: string;
}

const MIN_AREAS: Partial<Record<RoomType, number>> = {
  bedroom: 7.0,
  suite: 8.0,
  bathroom: 2.0,
  living: 10.0,
  kitchen: 4.0,
  service: 1.5,
  office: 5.0,
};

export function validateNBR(rooms: Room[]): NBRIssue[] {
  const issues: NBRIssue[] = [];
  rooms.forEach(r => {
    const min = MIN_AREAS[r.type];
    const area = r.width * r.height;
    if (min && area < min) {
      issues.push({
        level: 'warn',
        message: `${r.name}: ${area.toFixed(1)} m² abaixo do mínimo NBR (${min} m²)`,
      });
    }
    if ((r.type === 'bedroom' || r.type === 'suite' || r.type === 'living' || r.type === 'office')
        && Math.min(r.width, r.height) < 2.0) {
      issues.push({
        level: 'error',
        message: `${r.name}: largura mínima 2,0 m não atendida (${Math.min(r.width, r.height).toFixed(2)} m)`,
      });
    }
    if (r.type === 'circulation' && Math.min(r.width, r.height) < 0.8) {
      issues.push({
        level: 'error',
        message: `${r.name}: largura de circulação inferior a 0,80 m`,
      });
    }
    // Validação de saídas/entradas: todo ambiente habitável precisa de porta
    const needsDoor: RoomType[] = ['bedroom', 'suite', 'bathroom', 'kitchen', 'office', 'service'];
    if (needsDoor.includes(r.type) && (!r.doors || r.doors.length === 0)) {
      issues.push({
        level: 'error',
        message: `${r.name}: sem porta de acesso (entrada/saída ausente)`,
      });
    }
    // Ambientes habitáveis precisam de janela (ventilação NBR 15575)
    const needsWindow: RoomType[] = ['bedroom', 'suite', 'living', 'kitchen', 'office'];
    if (needsWindow.includes(r.type) && (!r.windows || r.windows.length === 0)) {
      issues.push({
        level: 'warn',
        message: `${r.name}: sem janela (ventilação/iluminação natural insuficiente)`,
      });
    }
  });
  // Sala precisa existir (entrada principal)
  if (!rooms.some(r => r.type === 'living')) {
    issues.push({ level: 'error', message: 'Projeto sem sala de estar (acesso principal)' });
  }
  return issues;
}

/* ---------------- Geradores de layout ---------------- */

const REC = 0.5; // recuo do terreno

function makeBedroom(i: number, isSuite: boolean, x: number, y: number, w: number, h: number, doorWall: Door['wall'] = 'top', winWall: Window['wall'] = 'bottom'): Room {
  const winSide = (winWall === 'left' || winWall === 'right') ? h : w;
  const doorSide = (doorWall === 'left' || doorWall === 'right') ? h : w;
  return {
    id: `bed${i}`, name: isSuite ? 'Suíte' : `Quarto ${i + 1}`,
    type: isSuite ? 'suite' : 'bedroom',
    x, y, width: w, height: h,
    windows: [{ x: winSide / 2 - 0.6, y: 0, width: 1.2, type: 'normal', wall: winWall }],
    doors: [{ x: doorSide / 2 - 0.4, y: 0, width: 0.8, wall: doorWall, swing: 'in' }],
  };
}

function makeBathroom(i: number, x: number, y: number, w: number, h: number, doorWall: Door['wall']): Room {
  const doorSide = (doorWall === 'left' || doorWall === 'right') ? h : w;
  return {
    id: `bath${i}`, name: i === 0 ? 'Banheiro' : `Banheiro ${i + 1}`, type: 'bathroom',
    x, y, width: w, height: h,
    windows: [{ x: Math.min(w, h) - 0.7, y: 0, width: 0.6, type: 'basculante', wall: 'right' }],
    doors: [{ x: doorSide / 2 - 0.35, y: 0, width: 0.7, wall: doorWall, swing: 'in' }],
  };
}

/* Padrão: Corredor central (versão melhorada do anterior) */
function layoutCentralCorridor(d: LayoutInput): Room[] {
  const rooms: Room[] = [];
  const W = d.lotWidth - 2 * REC;
  const D = d.lotDepth - 2 * REC;

  const garageW = d.hasGarage ? Math.min(3.2, W * 0.3) : 0;
  if (d.hasGarage) {
    rooms.push({
      id: 'garage', name: 'Garagem', type: 'garage',
      x: REC, y: REC, width: garageW, height: 5.5,
      doors: [{ x: garageW / 2 - 1.25, y: 0, width: 2.5, wall: 'top', swing: 'out' }],
    });
  }

  const houseX = REC + garageW + (d.hasGarage ? 0.15 : 0);
  const houseW = W - garageW - (d.hasGarage ? 0.15 : 0);
  const houseY = REC;
  const houseD = D;

  const balconyD = d.hasBalcony ? 1.8 : 0;
  if (d.hasBalcony) {
    rooms.push({ id: 'balcony', name: 'Varanda', type: 'balcony', x: houseX, y: houseY, width: houseW, height: balconyD });
  }

  const socialY = houseY + balconyD + (d.hasBalcony ? 0.15 : 0);
  const socialD = Math.max(5.0, houseD * 0.4);
  rooms.push({
    id: 'living', name: 'Sala / Cozinha', type: 'living',
    x: houseX, y: socialY, width: houseW, height: socialD,
    windows: [
      { x: 0.5, y: 0, width: 2.0, type: 'normal', wall: 'top' },
      { x: houseW - 2.5, y: 0, width: 1.5, type: 'normal', wall: 'top' },
    ],
    doors: [{ x: houseW / 2 - 0.45, y: 0, width: 0.9, wall: 'top', swing: 'in' }],
  });

  const serviceW = Math.min(2.5, houseW * 0.3);
  const serviceD = 2.0;
  rooms.push({
    id: 'service', name: 'Serviço', type: 'service',
    x: houseX + houseW - serviceW, y: socialY + socialD + 0.15,
    width: serviceW, height: serviceD,
    windows: [{ x: serviceW - 0.8, y: 0, width: 0.6, type: 'basculante', wall: 'right' }],
    doors: [{ x: serviceW / 2 - 0.35, y: 0, width: 0.7, wall: 'top', swing: 'in' }],
  });

  const intimateY = socialY + socialD + 0.15;
  const intimateD = houseD - intimateY + houseY;
  const corridorH = 1.1;

  rooms.push({
    id: 'corridor', name: 'Circulação', type: 'circulation',
    x: houseX, y: intimateY, width: houseW - serviceW - 0.15, height: corridorH,
  });

  const bedroomsY = intimateY + corridorH + 0.15;
  const bedroomsD = Math.max(3.0, intimateD - corridorH - 0.15);
  const bathW = 1.8;
  const availW = houseW - bathW - 0.15;
  const bedW = availW / d.bedrooms;

  for (let i = 0; i < d.bedrooms; i++) {
    const isSuite = i === 0;
    rooms.push(makeBedroom(
      i, isSuite,
      houseX + i * (bedW + (i > 0 ? 0.15 : 0)),
      bedroomsY,
      bedW - (i > 0 ? 0.15 : 0),
      bedroomsD,
      'top', 'bottom'
    ));
  }

  const bathH = bedroomsD / Math.max(1, d.bathrooms);
  for (let i = 0; i < d.bathrooms; i++) {
    rooms.push(makeBathroom(
      i,
      houseX + houseW - bathW,
      bedroomsY + i * bathH,
      bathW,
      bathH - (i < d.bathrooms - 1 ? 0.15 : 0),
      'left'
    ));
  }
  return rooms;
}

/* Padrão: Linear — sala/cozinha frontal, quartos enfileirados */
function layoutLinear(d: LayoutInput): Room[] {
  const rooms: Room[] = [];
  const W = d.lotWidth - 2 * REC;
  const D = d.lotDepth - 2 * REC;

  const garageW = d.hasGarage ? Math.min(3.0, W * 0.28) : 0;
  if (d.hasGarage) {
    rooms.push({
      id: 'garage', name: 'Garagem', type: 'garage',
      x: REC, y: REC, width: garageW, height: 5.5,
      doors: [{ x: garageW / 2 - 1.25, y: 0, width: 2.5, wall: 'top', swing: 'out' }],
    });
  }
  const houseX = REC + garageW + (d.hasGarage ? 0.15 : 0);
  const houseW = W - garageW - (d.hasGarage ? 0.15 : 0);

  const balconyD = d.hasBalcony ? 1.6 : 0;
  if (d.hasBalcony) rooms.push({ id: 'balcony', name: 'Varanda', type: 'balcony', x: houseX, y: REC, width: houseW, height: balconyD });

  const socialY = REC + balconyD + (d.hasBalcony ? 0.15 : 0);
  const livingD = Math.max(4.0, houseW * 0.42);
  const kitchenD = Math.max(3.0, houseW * 0.3);

  rooms.push({
    id: 'living', name: 'Sala', type: 'living',
    x: houseX, y: socialY, width: houseW, height: livingD,
    windows: [{ x: 0.5, y: 0, width: 2.0, type: 'normal', wall: 'top' }],
    doors: [{ x: houseW / 2 - 0.45, y: 0, width: 0.9, wall: 'top', swing: 'in' }],
  });

  const kitchenW = houseW * 0.6 - 0.075;
  rooms.push({
    id: 'kitchen', name: 'Cozinha', type: 'kitchen',
    x: houseX, y: socialY + livingD + 0.15, width: kitchenW, height: kitchenD,
    windows: [{ x: 0.4, y: 0, width: 1.0, type: 'normal', wall: 'top' }],
    doors: [{ x: kitchenW / 2 - 0.4, y: 0, width: 0.8, wall: 'bottom', swing: 'in' }],
  });
  rooms.push({
    id: 'service', name: 'Serviço', type: 'service',
    x: houseX + houseW * 0.6 + 0.075, y: socialY + livingD + 0.15,
    width: houseW * 0.4 - 0.075, height: kitchenD,
    windows: [{ x: 0.3, y: 0, width: 0.6, type: 'basculante', wall: 'right' }],
  });

  const corridorY = socialY + livingD + kitchenD + 0.3;
  const corridorH = 1.1;
  rooms.push({ id: 'corridor', name: 'Circulação', type: 'circulation', x: houseX, y: corridorY, width: houseW, height: corridorH });

  const bedroomsY = corridorY + corridorH + 0.15;
  const bedroomsD = Math.max(3.0, REC + D - bedroomsY);
  const bathW = 1.8;
  const availW = houseW - bathW - 0.15;
  const bedW = availW / d.bedrooms;

  for (let i = 0; i < d.bedrooms; i++) {
    rooms.push(makeBedroom(
      i, i === 0,
      houseX + i * (bedW + (i > 0 ? 0.15 : 0)),
      bedroomsY,
      bedW - (i > 0 ? 0.15 : 0),
      bedroomsD,
      'top', 'bottom'
    ));
  }
  const bathH = bedroomsD / Math.max(1, d.bathrooms);
  for (let i = 0; i < d.bathrooms; i++) {
    rooms.push(makeBathroom(i, houseX + houseW - bathW, bedroomsY + i * bathH, bathW, bathH - (i < d.bathrooms - 1 ? 0.15 : 0), 'left'));
  }
  return rooms;
}

/* Padrão: Em L — social na frente direita, íntima esquerda/fundo */
function layoutLShape(d: LayoutInput): Room[] {
  const rooms: Room[] = [];
  const W = d.lotWidth - 2 * REC;
  const D = d.lotDepth - 2 * REC;

  const garageW = d.hasGarage ? Math.min(3.0, W * 0.28) : 0;
  if (d.hasGarage) {
    rooms.push({
      id: 'garage', name: 'Garagem', type: 'garage',
      x: REC, y: REC, width: garageW, height: 5.5,
      doors: [{ x: garageW / 2 - 1.25, y: 0, width: 2.5, wall: 'top', swing: 'out' }],
    });
  }
  const houseX = REC + garageW + (d.hasGarage ? 0.15 : 0);
  const houseW = W - garageW - (d.hasGarage ? 0.15 : 0);

  // Ala social (frente direita)
  const socialW = houseW * 0.55;
  const socialD = Math.max(5.0, D * 0.45);
  rooms.push({
    id: 'living', name: 'Sala / Cozinha', type: 'living',
    x: houseX + houseW - socialW, y: REC, width: socialW, height: socialD,
    windows: [{ x: 0.5, y: 0, width: 2.0, type: 'normal', wall: 'top' }],
    doors: [{ x: socialW / 2, y: 0, width: 0.9, wall: 'top', swing: 'in' }],
  });

  // Quartos frente esquerda
  const intimateW = houseW - socialW - 0.15;
  const bedroomsD = socialD;
  const bedH = bedroomsD / d.bedrooms;
  for (let i = 0; i < d.bedrooms; i++) {
    rooms.push(makeBedroom(
      i, i === 0,
      houseX, REC + i * bedH,
      intimateW, bedH - (i < d.bedrooms - 1 ? 0.15 : 0),
      'right', 'left'
    ));
  }

  // Corredor horizontal
  const corridorY = REC + socialD + 0.15;
  rooms.push({ id: 'corridor', name: 'Circulação', type: 'circulation', x: houseX, y: corridorY, width: houseW, height: 1.1 });

  // Banheiros + serviço fundo
  const backY = corridorY + 1.25;
  const backD = Math.max(2.0, REC + D - backY);
  const bathW = houseW / (d.bathrooms + 1);
  for (let i = 0; i < d.bathrooms; i++) {
    rooms.push(makeBathroom(i, houseX + i * bathW, backY, bathW - 0.15, backD, 'top'));
  }
  rooms.push({
    id: 'service', name: 'Serviço', type: 'service',
    x: houseX + d.bathrooms * bathW, y: backY,
    width: houseW - d.bathrooms * bathW, height: backD,
    windows: [{ x: 0.3, y: 0, width: 0.6, type: 'basculante', wall: 'right' }],
  });
  return rooms;
}

/* Padrão: Compacto — núcleo molhado central */
function layoutCompact(d: LayoutInput): Room[] {
  const rooms: Room[] = [];
  const W = d.lotWidth - 2 * REC;
  const D = d.lotDepth - 2 * REC;

  const garageW = d.hasGarage ? Math.min(3.0, W * 0.28) : 0;
  if (d.hasGarage) {
    rooms.push({
      id: 'garage', name: 'Garagem', type: 'garage',
      x: REC, y: REC, width: garageW, height: 5.0,
      doors: [{ x: garageW / 2 - 1.25, y: 0, width: 2.5, wall: 'top', swing: 'out' }],
    });
  }
  const houseX = REC + garageW + (d.hasGarage ? 0.15 : 0);
  const houseW = W - garageW - (d.hasGarage ? 0.15 : 0);

  const socialD = Math.max(4.5, D * 0.4);
  rooms.push({
    id: 'living', name: 'Sala / Cozinha', type: 'living',
    x: houseX, y: REC, width: houseW, height: socialD,
    windows: [{ x: 0.5, y: 0, width: 2.0, type: 'normal', wall: 'top' }],
    doors: [{ x: houseW / 2, y: 0, width: 0.9, wall: 'top', swing: 'in' }],
  });

  // Núcleo molhado: banheiro + serviço no centro
  const coreY = REC + socialD + 0.15;
  const coreD = 2.2;
  const bathW = houseW * 0.45;
  rooms.push(makeBathroom(0, houseX, coreY, bathW, coreD, 'top'));
  rooms.push({
    id: 'service', name: 'Serviço', type: 'service',
    x: houseX + bathW + 0.15, y: coreY, width: houseW - bathW - 0.15, height: coreD,
    windows: [{ x: 0.3, y: 0, width: 0.6, type: 'basculante', wall: 'right' }],
  });

  // Quartos no fundo
  const bedY = coreY + coreD + 0.15;
  const bedD = Math.max(3.0, REC + D - bedY);
  const bedW = houseW / d.bedrooms;
  for (let i = 0; i < d.bedrooms; i++) {
    rooms.push(makeBedroom(
      i, i === 0,
      houseX + i * bedW, bedY,
      bedW - (i < d.bedrooms - 1 ? 0.15 : 0), bedD,
      'top', 'bottom'
    ));
  }

  // Banheiros adicionais anexados lateralmente ao último quarto
  if (d.bathrooms > 1) {
    const extraBathW = Math.min(1.8, houseW * 0.22);
    const extraBathH = bedD / (d.bathrooms - 1);
    const lastBedX = houseX + (d.bedrooms - 1) * bedW;
    // Reduz a largura do último quarto para acomodar banheiros adicionais
    const lastBed = rooms.find(r => r.id === `bed${d.bedrooms - 1}`);
    if (lastBed) {
      lastBed.width = Math.max(2.0, lastBed.width - extraBathW - 0.15);
    }
    for (let i = 1; i < d.bathrooms; i++) {
      rooms.push(makeBathroom(
        i,
        lastBedX + (lastBed ? lastBed.width : bedW) + 0.15,
        bedY + (i - 1) * extraBathH,
        extraBathW,
        extraBathH - (i < d.bathrooms - 1 ? 0.15 : 0),
        'left'
      ));
    }
  }
  return rooms;
}

export function generateLayout(input: LayoutInput, pattern: LayoutPattern = 'central_corridor'): Room[] {
  switch (pattern) {
    case 'linear': return layoutLinear(input);
    case 'L_shape': return layoutLShape(input);
    case 'compact': return layoutCompact(input);
    case 'central_corridor':
    default: return layoutCentralCorridor(input);
  }
}
