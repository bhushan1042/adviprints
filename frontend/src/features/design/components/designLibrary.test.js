import {
  createStickerElement,
  createTemplateElements,
  createTextElement,
  constrainPositionToArea,
  DESIGN_TEMPLATES,
  fitElementsToArea,
  getCoverCrop,
  getPrintZones,
  TEMPLATE_CATEGORIES
} from './designLibrary';

describe('design library', () => {
  test('provides the requested starter categories with editable elements', () => {
    expect(TEMPLATE_CATEGORIES).toEqual(expect.arrayContaining([
      'Birthday', 'Couple', 'Friends', 'Family', 'College',
      'Gym', 'Funny', 'Minimal', 'Festival', 'Name + Photo'
    ]));
    expect(DESIGN_TEMPLATES.every((template) => template.elements.length > 0)).toBe(true);
  });

  test('creates independent, editable template layers', () => {
    const first = createTemplateElements('birthday');
    const second = createTemplateElements('birthday');

    expect(first).toHaveLength(2);
    expect(first[0]).toMatchObject({ type: 'text', text: 'BIRTHDAY', locked: false });
    expect(first[0].id).not.toBe(second[0].id);
  });

  test('creates default text and symbol artwork with transform settings', () => {
    expect(createTextElement()).toMatchObject({
      type: 'text',
      text: 'Your text',
      rotation: 0,
      scaleX: 1
    });
    expect(createStickerElement('★')).toMatchObject({
      type: 'sticker',
      text: '★',
      fill: '#000000',
      rotation: 0,
      locked: false
    });
    expect(createStickerElement('😀', '#000000', 'Segoe UI Emoji')).toMatchObject({
      text: '😀',
      fontFamily: 'Segoe UI Emoji',
      fill: '#000000'
    });
  });

  test('fits each starter layout inside the printable area without changing layer order', () => {
    const area = { x: 135, y: 196, width: 230, height: 240 };
    DESIGN_TEMPLATES.forEach((template) => {
      const fitted = fitElementsToArea(createTemplateElements(template.id), area);
      expect(fitted).toHaveLength(template.elements.length);
      fitted.forEach((element) => {
        expect(element.x).toBeGreaterThanOrEqual(area.x);
        expect(element.y).toBeGreaterThanOrEqual(area.y);
        expect(element.x + element.width * element.scaleX).toBeLessThanOrEqual(area.x + area.width + 0.001);
        expect(element.y + element.height * element.scaleY).toBeLessThanOrEqual(area.y + area.height + 0.001);
      });
    });

  });

  test('preserves already-in-bounds artwork positions', () => {
    const area = { x: 135, y: 196, width: 230, height: 240 };
    const elements = [{ id: 'text-1', x: 170, y: 290, width: 160, height: 44, scaleX: 1, scaleY: 1 }];

    expect(fitElementsToArea(elements, area)).toEqual(elements);
  });

  test('repositions small artwork that starts outside the printable area', () => {
    const area = { x: 135, y: 196, width: 230, height: 240 };
    const elements = [{ id: 'text-1', x: -20, y: 200, width: 40, height: 40, scaleX: 1, scaleY: 1 }];
    const [fitted] = fitElementsToArea(elements, area);

    expect(fitted.x).toBeGreaterThanOrEqual(area.x);
    expect(fitted.y).toBeGreaterThanOrEqual(area.y);
    expect(fitted.x + fitted.width * fitted.scaleX).toBeLessThanOrEqual(area.x + area.width);
    expect(fitted.y + fitted.height * fitted.scaleY).toBeLessThanOrEqual(area.y + area.height);
  });

  test('provides side-specific, product-aware normalized placement zones', () => {
    const frontZones = getPrintZones(
      { name: 'Black Cotton T-Shirt', category: 'T-Shirts' },
      'front',
      500,
      620
    );
    const backZones = getPrintZones(
      { name: 'Black Cotton T-Shirt', category: 'T-Shirts' },
      'back',
      500,
      620
    );
    const poloZones = getPrintZones({ name: 'Polo Shirt' }, 'front', 1000, 1240);

    expect(frontZones.map((zone) => zone.id)).toEqual(expect.arrayContaining([
      'center-chest', 'left-chest', 'right-chest', 'left-sleeve'
    ]));
    expect(backZones.map((zone) => zone.id)).toEqual(['upper-back', 'center-back']);
    expect(poloZones.map((zone) => zone.id)).toEqual(['left-chest', 'right-chest']);
    expect(poloZones[0].width).toBe(frontZones.find((zone) => zone.id === 'left-chest').width * 2);
  });

  test('honors product-configured zones in normalized canvas coordinates', () => {
    const [zone] = getPrintZones({
      printZones: [{ id: 'custom-front', name: 'Custom Front', side: 'front', x: .1, y: .2, width: .3, height: .4 }]
    }, 'front', 500, 620);

    expect(zone).toMatchObject({
      id: 'custom-front',
      name: 'Custom Front',
      x: 50,
      y: 124,
      width: 150,
      height: 248
    });
  });

  test('clamps drag positions and centers objects larger than their print zone', () => {
    const area = { x: 100, y: 100, width: 100, height: 80 };
    const current = { x: 120, y: 120 };
    const bounds = { x: 120, y: 120, width: 40, height: 30 };
    expect(constrainPositionToArea({ x: 300, y: -50 }, current, bounds, area))
      .toEqual({ x: 160, y: 100 });

    const oversized = { x: 50, y: 40, width: 160, height: 120 };
    expect(constrainPositionToArea({ x: 50, y: 40 }, { x: 50, y: 40 }, oversized, area))
      .toEqual({ x: 70, y: 80 });
  });

  test('marks the Name + Photo artwork as a clickable photo slot', () => {
    const [photoSlot] = createTemplateElements('name-photo');
    expect(photoSlot).toMatchObject({
      type: 'sticker',
      text: 'ADD YOUR PHOTO',
      frame: true,
      photoPlaceholder: true
    });
  });

  test('crops uploaded photos to cover the slot without distorting the source', () => {
    expect(getCoverCrop(400, 200, 100, 100)).toEqual({
      x: 100,
      y: 0,
      width: 200,
      height: 200
    });
    expect(getCoverCrop(200, 400, 100, 100)).toEqual({
      x: 0,
      y: 100,
      width: 200,
      height: 200
    });
  });
});
