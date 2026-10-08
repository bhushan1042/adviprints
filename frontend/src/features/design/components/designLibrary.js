export const DESIGN_TEMPLATES = [
  {
    id: 'birthday',
    category: 'Birthday',
    name: 'Birthday Club',
    description: 'A bold birthday headline with a year detail.',
    elements: [
      { type: 'text', text: 'BIRTHDAY', x: 135, y: 250, width: 230, height: 54, fontSize: 34, fontFamily: 'Arial', fontStyle: 'bold', fill: '#102a43', align: 'center', letterSpacing: 2 },
      { type: 'text', text: 'CLUB 2026', x: 150, y: 306, width: 200, height: 28, fontSize: 17, fontFamily: 'Arial', fontStyle: 'bold', fill: '#e87524', align: 'center', letterSpacing: 3 }
    ]
  },
  {
    id: 'couple',
    category: 'Couple',
    name: 'Better Together',
    description: 'A clean paired type treatment.',
    elements: [
      { type: 'text', text: 'BETTER', x: 140, y: 255, width: 220, height: 48, fontSize: 31, fontFamily: 'Georgia', fontStyle: 'bold', fill: '#102a43', align: 'center', letterSpacing: 2 },
      { type: 'sticker', text: '&', x: 220, y: 307, width: 60, height: 55, fontSize: 38, fill: '#e87524', align: 'center' },
      { type: 'text', text: 'TOGETHER', x: 140, y: 360, width: 220, height: 34, fontSize: 20, fontFamily: 'Arial', fontStyle: 'bold', fill: '#102a43', align: 'center', letterSpacing: 3 }
    ]
  },
  {
    id: 'friends',
    category: 'Friends',
    name: 'The Good Ones',
    description: 'A small-batch friends-uniform idea.',
    elements: [
      { type: 'sticker', text: '★', x: 218, y: 228, width: 64, height: 60, fontSize: 48, fill: '#e87524', align: 'center' },
      { type: 'text', text: 'THE GOOD ONES', x: 125, y: 294, width: 250, height: 42, fontSize: 24, fontFamily: 'Arial', fontStyle: 'bold', fill: '#102a43', align: 'center', letterSpacing: 1 }
    ]
  },
  {
    id: 'family',
    category: 'Family',
    name: 'Home Team',
    description: 'A simple family team graphic.',
    elements: [
      { type: 'text', text: 'HOME', x: 140, y: 252, width: 220, height: 54, fontSize: 38, fontFamily: 'Arial', fontStyle: 'bold', fill: '#102a43', align: 'center', letterSpacing: 4 },
      { type: 'text', text: 'TEAM', x: 140, y: 307, width: 220, height: 40, fontSize: 27, fontFamily: 'Arial', fontStyle: 'bold', fill: '#e87524', align: 'center', letterSpacing: 6 }
    ]
  },
  {
    id: 'college',
    category: 'College',
    name: 'Campus Society',
    description: 'An athletic-inspired campus layout.',
    elements: [
      { type: 'text', text: 'CAMPUS', x: 135, y: 254, width: 230, height: 48, fontSize: 31, fontFamily: 'Georgia', fontStyle: 'bold', fill: '#102a43', align: 'center', letterSpacing: 4 },
      { type: 'text', text: 'SOCIAL CLUB · 2026', x: 145, y: 308, width: 210, height: 25, fontSize: 13, fontFamily: 'Arial', fontStyle: 'bold', fill: '#e87524', align: 'center', letterSpacing: 1 }
    ]
  },
  {
    id: 'gym',
    category: 'Gym',
    name: 'One More Rep',
    description: 'A high-contrast training mantra.',
    elements: [
      { type: 'text', text: 'ONE MORE', x: 130, y: 264, width: 240, height: 43, fontSize: 28, fontFamily: 'Arial', fontStyle: 'bold', fill: '#102a43', align: 'center', letterSpacing: 2 },
      { type: 'text', text: 'REP.', x: 155, y: 311, width: 190, height: 60, fontSize: 45, fontFamily: 'Arial', fontStyle: 'bold', fill: '#e87524', align: 'center', letterSpacing: 3 }
    ]
  },
  {
    id: 'funny',
    category: 'Funny',
    name: 'Low Battery',
    description: 'A dry little everyday mood.',
    elements: [
      { type: 'sticker', text: '▰ ▱ ▱', x: 170, y: 248, width: 160, height: 36, fontSize: 22, fill: '#e87524', align: 'center' },
      { type: 'text', text: 'LOW BATTERY', x: 130, y: 291, width: 240, height: 38, fontSize: 25, fontFamily: 'Arial', fontStyle: 'bold', fill: '#102a43', align: 'center', letterSpacing: 2 },
      { type: 'text', text: 'PLEASE RECHARGE', x: 145, y: 335, width: 210, height: 24, fontSize: 13, fontFamily: 'Arial', fill: '#102a43', align: 'center', letterSpacing: 1 }
    ]
  },
  {
    id: 'minimal',
    category: 'Minimal',
    name: 'Quietly Here',
    description: 'Understated type for a subtle print.',
    elements: [
      { type: 'text', text: 'quietly here', x: 145, y: 292, width: 210, height: 38, fontSize: 24, fontFamily: 'Georgia', fontStyle: 'italic', fill: '#102a43', align: 'center' }
    ]
  },
  {
    id: 'festival',
    category: 'Festival',
    name: 'Good Energy',
    description: 'A bright, easy-going event print.',
    elements: [
      { type: 'sticker', text: '✳', x: 218, y: 232, width: 64, height: 58, fontSize: 45, fill: '#e87524', align: 'center' },
      { type: 'text', text: 'GOOD ENERGY', x: 132, y: 296, width: 236, height: 40, fontSize: 24, fontFamily: 'Arial', fontStyle: 'bold', fill: '#102a43', align: 'center', letterSpacing: 2 }
    ]
  },
  {
    id: 'name-photo',
    category: 'Name + Photo',
    name: 'Made by You',
    description: 'A photo-ready frame with editable name text.',
    elements: [
      { type: 'sticker', text: 'ADD YOUR PHOTO', x: 170, y: 220, width: 160, height: 110, fontSize: 14, fill: '#d9e2ec', align: 'center', frame: true, photoPlaceholder: true },
      { type: 'text', text: 'YOUR NAME', x: 145, y: 340, width: 210, height: 32, fontSize: 21, fontFamily: 'Arial', fontStyle: 'bold', fill: '#102a43', align: 'center', letterSpacing: 2 }
    ]
  }
];

export const TEMPLATE_CATEGORIES = ['All', ...DESIGN_TEMPLATES.map((template) => template.category)];

const PRINT_ZONE_PRESETS = {
  tShirt: {
    front: [
      { id: 'center-chest', name: 'Center Chest', x: .32, y: .34, width: .36, height: .22 },
      { id: 'left-chest', name: 'Left Chest', x: .57, y: .35, width: .14, height: .14 },
      { id: 'right-chest', name: 'Right Chest', x: .29, y: .35, width: .14, height: .14 },
      { id: 'upper-chest', name: 'Upper Chest', x: .34, y: .28, width: .32, height: .14 },
      { id: 'lower-front', name: 'Lower Front', x: .34, y: .57, width: .32, height: .18 },
      { id: 'left-sleeve', name: 'Left Sleeve', x: .76, y: .3, width: .16, height: .13 },
      { id: 'right-sleeve', name: 'Right Sleeve', x: .08, y: .3, width: .16, height: .13 }
    ],
    back: [
      { id: 'upper-back', name: 'Upper Back', x: .32, y: .28, width: .36, height: .16 },
      { id: 'center-back', name: 'Center Back', x: .32, y: .38, width: .36, height: .3 }
    ]
  },
  polo: {
    front: [
      { id: 'left-chest', name: 'Left Chest', x: .57, y: .35, width: .14, height: .14 },
      { id: 'right-chest', name: 'Right Chest', x: .29, y: .35, width: .14, height: .14 }
    ],
    back: [
      { id: 'center-back', name: 'Center Back', x: .32, y: .38, width: .36, height: .3 }
    ]
  },
  sleeveless: {
    front: [
      { id: 'center-chest', name: 'Center Chest', x: .32, y: .34, width: .36, height: .22 }
    ],
    back: [
      { id: 'upper-back', name: 'Upper Back', x: .32, y: .28, width: .36, height: .16 },
      { id: 'center-back', name: 'Center Back', x: .32, y: .38, width: .36, height: .3 }
    ]
  }
};

export const getPrintZones = (product, side, canvasWidth, canvasHeight) => {
  const configuredZones = Array.isArray(product?.printZones)
    ? product.printZones.filter((zone) => zone.side === side)
    : null;
  const productType = `${product?.productType || product?.type || ''} ${product?.category || ''} ${product?.name || ''}`.toLowerCase();
  const preset = /polo/.test(productType)
    ? PRINT_ZONE_PRESETS.polo
    : /sleeveless|tank top/.test(productType)
      ? PRINT_ZONE_PRESETS.sleeveless
      : PRINT_ZONE_PRESETS.tShirt;
  const zones = configuredZones?.length ? configuredZones : preset[side];
  return zones.map((zone) => ({
    ...zone,
    x: zone.x * canvasWidth,
    y: zone.y * canvasHeight,
    width: zone.width * canvasWidth,
    height: zone.height * canvasHeight
  }));
};

export const constrainPositionToArea = (position, currentPosition, bounds, area) => {
  const offsetX = position.x - currentPosition.x;
  const offsetY = position.y - currentPosition.y;
  const minOffsetX = area.x - bounds.x - offsetX;
  const maxOffsetX = area.x + area.width - bounds.x - bounds.width - offsetX;
  const minOffsetY = area.y - bounds.y - offsetY;
  const maxOffsetY = area.y + area.height - bounds.y - bounds.height - offsetY;
  const correctionX = minOffsetX > maxOffsetX
    ? area.x + area.width / 2 - bounds.x - bounds.width / 2 - offsetX
    : Math.max(minOffsetX, Math.min(maxOffsetX, 0));
  const correctionY = minOffsetY > maxOffsetY
    ? area.y + area.height / 2 - bounds.y - bounds.height / 2 - offsetY
    : Math.max(minOffsetY, Math.min(maxOffsetY, 0));

  return {
    x: position.x + correctionX,
    y: position.y + correctionY
  };
};

export const getCoverCrop = (sourceWidth, sourceHeight, targetWidth, targetHeight) => {
  const targetRatio = targetWidth / Math.max(targetHeight, 1);
  const sourceRatio = sourceWidth / Math.max(sourceHeight, 1);
  return sourceRatio > targetRatio
    ? {
      x: (sourceWidth - sourceHeight * targetRatio) / 2,
      y: 0,
      width: sourceHeight * targetRatio,
      height: sourceHeight
    }
    : {
      x: 0,
      y: (sourceHeight - sourceWidth / targetRatio) / 2,
      width: sourceWidth,
      height: sourceWidth / targetRatio
    };
};

export const fitElementsToArea = (elements, area) => {
  if (!elements.length) return elements;
  const bounds = elements.reduce((result, element) => ({
    left: Math.min(result.left, element.x),
    top: Math.min(result.top, element.y),
    right: Math.max(result.right, element.x + element.width * (element.scaleX || 1)),
    bottom: Math.max(result.bottom, element.y + element.height * (element.scaleY || 1))
  }), {
    left: Infinity,
    top: Infinity,
    right: -Infinity,
    bottom: -Infinity
  });
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  const alreadyInside = (
    bounds.left >= area.x &&
    bounds.top >= area.y &&
    bounds.right <= area.x + area.width &&
    bounds.bottom <= area.y + area.height
  );
  if (alreadyInside) return elements.map((element) => ({ ...element }));

  const scale = Math.min(1, area.width / width, area.height / height);
  const centerX = (bounds.left + bounds.right) / 2;
  const centerY = (bounds.top + bounds.bottom) / 2;
  const areaCenterX = area.x + area.width / 2;
  const areaCenterY = area.y + area.height / 2;
  const offsetX = areaCenterX - centerX * scale;
  const offsetY = areaCenterY - centerY * scale;

  return elements.map((element) => ({
    ...element,
    x: element.x * scale + offsetX,
    y: element.y * scale + offsetY,
    scaleX: (element.scaleX || 1) * scale,
    scaleY: (element.scaleY || 1) * scale
  }));
};

let elementSequence = 0;
const createId = (prefix) => `${prefix}-${Date.now()}-${++elementSequence}`;

export const createTemplateElements = (templateId) => {
  const template = DESIGN_TEMPLATES.find((item) => item.id === templateId);
  if (!template) return [];

  return template.elements.map((element, index) => ({
    ...element,
    id: createId(`${template.id}-${index}`),
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    locked: false
  }));
};

export const createTextElement = (text = 'Your text', fill = '#102a43') => ({
  id: createId('text'),
  type: 'text',
  text,
  x: 170,
  y: 290,
  width: 160,
  height: 44,
  fontSize: 28,
  fontFamily: 'Arial',
  fontStyle: 'bold',
  fill,
  align: 'center',
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  locked: false
});

export const createStickerElement = (text, fill = '#000000', fontFamily = 'Arial') => ({
  id: createId('sticker'),
  type: 'sticker',
  text,
  x: 205,
  y: 285,
  width: 90,
  height: 64,
  fontSize: 48,
  fontFamily,
  fill,
  align: 'center',
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  locked: false
});
