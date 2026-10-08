import {
  createStickerElement,
  createTemplateElements,
  createTextElement,
  DESIGN_TEMPLATES,
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
      rotation: 0,
      locked: false
    });
  });
});
