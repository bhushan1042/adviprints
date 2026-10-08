import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter, AlignHorizontalJustifyCenter, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bold,
  Check, Copy, Eye, FileImage, FlipHorizontal, ImagePlus,
  Layers, Lock, Plus, Redo2, RotateCcw, Sparkles, Trash2, Type,
  Undo2, Unlock, X, ZoomIn, ZoomOut
} from 'lucide-react';
import { Group, Image as KonvaImage, Layer, Rect, Stage, Text, Transformer } from 'react-konva';
import useImage from 'use-image';
import {
  DESIGN_TEMPLATES,
  createStickerElement,
  createTemplateElements,
  createTextElement,
  constrainPositionToArea,
  fitElementsToArea,
  getCoverCrop,
  getPrintZones
} from './designLibrary';
import styles from './DesignEditor.module.css';
import BrandLogo from '@/components/ui/BrandLogo';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 620;
const FONT_FAMILIES = [
  'Arial', 'Arial Black', 'Arial Narrow', 'Comic Sans MS', 'Courier New',
  'Georgia', 'Impact', 'Lucida Console', 'Lucida Sans Unicode',
  'Palatino Linotype', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana',
  'system-ui', 'serif', 'sans-serif', 'monospace'
];
const GARMENT_MOCKUPS = {
  front: '/images/tshirt-template.jpg',
  back: '/images/tshirt-template-back.png'
};
const GARMENT_COLORS = {
  white: '#f9fafb',
  black: '#22272d',
  navy: '#18324a',
  blue: '#315f95',
  red: '#b63e3e',
  green: '#47745b',
  grey: '#92999f',
  gray: '#92999f',
  maroon: '#743949',
  pink: '#d88da0',
  yellow: '#e8c75b',
  orange: '#df7a34',
  purple: '#73518d',
  beige: '#c9b99f',
  lightblue: '#8daec9',
  darkblue: '#254963',
  lightgrey: '#c0c5c9',
  lightgray: '#c0c5c9',
  darkgrey: '#59646e',
  darkgray: '#59646e',
  charcoal: '#454d55',
  forestgreen: '#385c4a',
  offwhite: '#ece9e1'
};

const garmentFill = (colour) => {
  const value = String(colour || '').trim();
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return value;
  if (/^[a-z\s_-]{3,24}$/i.test(value)) {
    const key = value.toLowerCase().replace(/[\s_-]+/g, '');
    return GARMENT_COLORS[key] || '#f9fafb';
  }
  return '#f9fafb';
};

const isDarkGarmentColor = (colour) => {
  const value = garmentFill(colour);
  const hex = value.length === 4
    ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
    : value;
  const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const luminance = channels.map((channel) => (
    channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4
  ));
  return luminance[0] * .2126 + luminance[1] * .7152 + luminance[2] * .0722 < .36;
};

const makeGarmentMockup = (image, colour, side) => {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const context = canvas.getContext('2d');
  if (side === 'back') {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.scale(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    context.beginPath();
    context.moveTo(286, 105);
    context.lineTo(204, 137);
    context.lineTo(130, 183);
    context.lineTo(8, 376);
    context.lineTo(155, 462);
    context.lineTo(132, 856);
    context.quadraticCurveTo(380, 879, 628, 855);
    context.lineTo(610, 440);
    context.lineTo(613, 462);
    context.lineTo(742, 377);
    context.lineTo(625, 182);
    context.lineTo(543, 137);
    context.lineTo(462, 105);
    context.closePath();
    context.clip();
    context.drawImage(image, 0, 0);
    context.globalCompositeOperation = 'multiply';
    context.globalAlpha = .84;
    context.fillStyle = garmentFill(colour);
    context.fillRect(0, 0, image.naturalWidth, image.naturalHeight);
    context.restore();
    return canvas;
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const scaleX = canvas.width / image.naturalWidth;
  const scaleY = canvas.height / image.naturalHeight;
  context.save();
  context.scale(scaleX, scaleY);
  context.beginPath();
  context.moveTo(218, 104);
  context.lineTo(127, 144);
  context.lineTo(83, 169);
  context.lineTo(2, 320);
  context.lineTo(80, 393);
  context.lineTo(121, 354);
  context.lineTo(95, 762);
  context.quadraticCurveTo(294, 779, 493, 762);
  context.lineTo(467, 354);
  context.lineTo(508, 393);
  context.lineTo(586, 320);
  context.lineTo(505, 169);
  context.lineTo(461, 144);
  context.lineTo(370, 104);
  context.closePath();
  if (side === 'front') {
    context.moveTo(220, 108);
    context.bezierCurveTo(231, 137, 258, 157, 294, 164);
    context.bezierCurveTo(330, 157, 357, 137, 368, 108);
    context.closePath();
  }
  context.clip('evenodd');
  context.globalCompositeOperation = 'multiply';
  context.globalAlpha = .84;
  context.fillStyle = garmentFill(colour);
  context.fillRect(0, 0, image.naturalWidth, image.naturalHeight);
  context.restore();
  return canvas;
};

const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

const textLineCount = (text, width, fontSize, fontFamily, fontStyle) => {
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return Math.max(1, Math.ceil(String(text).length * fontSize * 0.6 / width));
  const weight = String(fontStyle || '').includes('bold') ? 'bold ' : '';
  const slant = String(fontStyle || '').includes('italic') ? 'italic ' : '';
  context.font = `${slant}${weight}${fontSize}px "${fontFamily || 'Arial'}"`;
  return String(text).split('\n').reduce((lineTotal, paragraph) => {
    let lines = 1;
    let line = '';
    paragraph.split(/\s+/).filter(Boolean).forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width <= width) {
        line = candidate;
      } else if (line) {
        lines += 1;
        line = word;
      } else {
        lines += Math.max(0, Math.ceil(context.measureText(word).width / width) - 1);
        line = word;
      }
    });
    return lineTotal + lines;
  }, 0);
};

const fitTextToPrintArea = (element, area) => {
  if (element.type !== 'text') return element;
  const next = {
    ...element,
    x: Math.max(area.x, element.x),
    y: Math.max(area.y, element.y)
  };
  const scaleX = next.scaleX || 1;
  const scaleY = next.scaleY || 1;
  const availableWidth = Math.max(1, Math.min(
    next.width * scaleX,
    area.x + area.width - next.x
  ));
  const availableHeight = Math.max(1, (area.y + area.height - next.y) / scaleY);
  const width = availableWidth / scaleX;
  let low = 8;
  let high = next.fontSize || 26;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const fontSize = (low + high) / 2;
    const height = textLineCount(next.text, width, fontSize, next.fontFamily, next.fontStyle) * fontSize * 1.25;
    if (height <= availableHeight) low = fontSize;
    else high = fontSize;
  }
  return {
    ...next,
    width,
    fontSize: Math.max(8, Math.min(next.fontSize || 26, low))
  };
};

const readImageFile = (file) => new Promise((resolve, reject) => {
  if (!file || !file.type.startsWith('image/')) {
    reject(new Error('Choose an image file such as PNG, JPG, or WEBP.'));
    return;
  }
  if (file.size > 12 * 1024 * 1024) {
    reject(new Error('This image is larger than 12 MB. Please choose a smaller file.'));
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => reject(new Error('The image could not be read. Please try another file.'));
  reader.onload = () => {
    const image = new window.Image();
    image.onerror = () => reject(new Error('This image could not be decoded. Please try another file.'));
    image.onload = () => resolve({
      src: String(reader.result),
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight
    });
    image.src = String(reader.result);
  };
  reader.readAsDataURL(file);
});

const makeImageElement = ({ src, naturalWidth, naturalHeight }, index = 0, slot = null, zoneId) => {
  if (slot) {
    const width = slot.width * (slot.scaleX || 1);
    const height = slot.height * (slot.scaleY || 1);
    return {
      id: `image-${Date.now()}-${index}`,
      type: 'image',
      src,
      naturalWidth,
      naturalHeight,
      crop: getCoverCrop(naturalWidth, naturalHeight, width, height),
      x: slot.x,
      y: slot.y,
      width,
      height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      zoneId,
      photoSlotId: slot.id,
      locked: false
    };
  }
  const ratio = naturalWidth / Math.max(naturalHeight, 1);
  const width = Math.min(132, 180 * ratio);
  const height = Math.min(154, 180 / Math.max(ratio, .1));
  return {
    id: `image-${Date.now()}-${index}`,
    type: 'image',
    src,
    naturalWidth,
    naturalHeight,
    x: (CANVAS_WIDTH - width) / 2,
    y: 250,
    width,
    height,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    zoneId,
    locked: false
  };
};

const ShirtArtwork = ({ colour, side, product }) => {
  const [image] = useImage(product?.mockups?.[side] || GARMENT_MOCKUPS[side]);
  const mockup = useMemo(() => image && makeGarmentMockup(image, colour, side), [image, colour, side]);
  return mockup
    ? <KonvaImage image={mockup} x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} listening={false} />
    : null;
};

const ArtworkElement = ({ element, area, stageRef, isSelected, onSelect, onNode, onDragEnd, onTransformEnd, onPhotoPlaceholderClick }) => {
  const [image] = useImage(element.type === 'image' ? element.src : null);
  const nodeRef = useRef(null);
  const registerNode = useCallback((node) => {
    nodeRef.current = node;
    onNode(element.id, node);
  }, [element.id, onNode]);
  const handleSelect = (event) => {
    event.cancelBubble = true;
    if (element.photoPlaceholder) {
      onPhotoPlaceholderClick(element);
      return;
    }
    onSelect(element.id, event.evt.shiftKey || event.evt.metaKey || event.evt.ctrlKey);
  };

  return (
    <Group
      ref={registerNode}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation || 0}
      scaleX={element.scaleX || 1}
      scaleY={element.scaleY || 1}
      draggable={!element.locked}
      dragBoundFunc={(position) => {
        const node = nodeRef.current;
        const stage = stageRef.current;
        if (!node || !stage) return position;
        return constrainPositionToArea(
          position,
          node.absolutePosition(),
          node.getClientRect({ relativeTo: stage }),
          area
        );
      }}
      onClick={handleSelect}
      onTap={handleSelect}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    >
      {element.type === 'image' && image && (
        <KonvaImage image={image} crop={element.crop} width={element.width} height={element.height} />
      )}
      {element.type === 'text' && (
        <Text
          text={element.text}
          width={element.width}
          fontSize={element.fontSize || 26}
          fontFamily={element.fontFamily || 'Arial'}
          fontStyle={element.fontStyle || 'normal'}
          fill={element.fill || '#102a43'}
          align={element.align || 'center'}
          verticalAlign="middle"
          letterSpacing={element.letterSpacing || 0}
          wrap="word"
        />
      )}
      {element.type === 'sticker' && (
        <>
          {element.frame && (
            <Rect
              width={element.width}
              height={element.height}
              fill="#f5f7f9"
              stroke="#9fb3c8"
              strokeWidth={1.5}
              dash={[6, 5]}
              cornerRadius={8}
            />
          )}
          <Text
            text={element.text}
            width={element.width}
            height={element.height}
            fontSize={element.fontSize || 42}
            fontFamily={element.fontFamily || 'Arial'}
            fontStyle={element.fontFamily?.includes('Emoji') ? 'normal' : 'bold'}
            fill={element.fill || '#000000'}
            align="center"
            verticalAlign="middle"
            letterSpacing={1}
          />
        </>
      )}
      {isSelected && !element.locked && (
        <Rect
          width={element.width}
          height={element.height}
          stroke="#334155"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      )}
    </Group>
  );
};

const DesignEditor = ({
  onSave,
  onCancel,
  selectedTemplate = 'blank',
  initialDesign = null,
  product,
  selectedColour,
  selectedSize,
  quantity = 1
}) => {
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const nodeRefs = useRef({});
  const uploadRef = useRef(null);
  const pendingPhotoSlotRef = useRef(null);
  const [view, setView] = useState(initialDesign?.view || 'front');
  const [zoom, setZoom] = useState(1);
  const [activePanel, setActivePanel] = useState('create');
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [templateCategory, setTemplateCategory] = useState('All');
  const [stickerCategory, setStickerCategory] = useState('Emoji');
  const [templateSearch, setTemplateSearch] = useState('');
  const garmentColor = selectedColour || initialDesign?.garmentColor || 'white';
  const defaultInk = isDarkGarmentColor(garmentColor) ? '#ffffff' : '#102a43';
  const zonesBySide = useMemo(() => ({
    front: getPrintZones(product, 'front', CANVAS_WIDTH, CANVAS_HEIGHT),
    back: getPrintZones(product, 'back', CANVAS_WIDTH, CANVAS_HEIGHT)
  }), [product]);
  const defaultZoneBySide = {
    front: zonesBySide.front[0]?.id,
    back: zonesBySide.back[0]?.id
  };
  const [activeZonesBySide, setActiveZonesBySide] = useState(() => ({
    front: initialDesign?.placementsBySide?.front || defaultZoneBySide.front,
    back: initialDesign?.placementsBySide?.back || defaultZoneBySide.back
  }));
  const zoneFor = (side, zoneId) => (
    zonesBySide[side].find((zone) => zone.id === zoneId) || zonesBySide[side][0]
  );
  const starterElements = useMemo(() => {
    if (!selectedTemplate || selectedTemplate === 'blank') return [];
    const elements = createTemplateElements(selectedTemplate).map((element) => (
      {
        ...(element.fill === '#102a43' ? { ...element, fill: defaultInk } : element),
        zoneId: defaultZoneBySide.front
      }
    ));
    return fitElementsToArea(elements, zoneFor('front', defaultZoneBySide.front));
  }, [defaultInk, defaultZoneBySide.front, selectedTemplate, zonesBySide]);
  const initialSides = initialDesign?.elementsByView || {
    front: initialDesign?.elements || starterElements,
    back: []
  };
  const prepareSideElements = (side, sideElements) => {
    const defaultZoneId = defaultZoneBySide[side];
    const availableZoneIds = zonesBySide[side].map((zone) => zone.id);
    const normalized = sideElements.map((element) => ({
      ...element,
      zoneId: availableZoneIds.includes(element.zoneId) ? element.zoneId : defaultZoneId
    }));
    return zonesBySide[side].flatMap((zone) => {
      const zoneElements = normalized.filter((element) => element.zoneId === zone.id);
      return fitElementsToArea(zoneElements, zone)
        .map((element) => fitTextToPrintArea(element, zone));
    });
  };
  const [history, setHistory] = useState({
    past: [],
    present: {
      front: prepareSideElements('front', initialSides.front || []),
      back: prepareSideElements('back', initialSides.back || [])
    },
    future: []
  });
  const elements = history.present[view] || [];
  const printArea = zoneFor(view, activeZonesBySide[view] || defaultZoneBySide[view]);
  const selectedZoneId = printArea.id;
  const zoneForElement = (element) => zoneFor(view, element.zoneId || defaultZoneBySide[view]);
  const selectedElement = elements.find((element) => selectedIds.includes(element.id)) || null;
  const selectedText = selectedIds.length === 1 && selectedElement?.type === 'text';
  const filteredTemplates = useMemo(() => DESIGN_TEMPLATES.filter((template) => (
    (templateCategory === 'All' || template.category === templateCategory) &&
    `${template.name} ${template.category} ${template.description}`.toLowerCase().includes(templateSearch.toLowerCase())
  )), [templateCategory, templateSearch]);
  const selectedCategories = useMemo(() => ['All', ...new Set(DESIGN_TEMPLATES.map((item) => item.category))], []);
  // Prefer the selected image; otherwise check the first image on this side.
  // The print-quality checklist remains accurate even when no image is selected.
  const selectedImage = elements.find((element) => selectedIds.includes(element.id) && element.type === 'image')
    || elements.find((element) => element.type === 'image');
  const outsidePrintArea = elements.some((element) => {
    const area = zoneForElement(element);
    return element.x < area.x ||
      element.y < area.y ||
      element.x + element.width * (element.scaleX || 1) > area.x + area.width ||
      element.y + element.height * (element.scaleY || 1) > area.y + area.height;
  });
  const lowResolution = Boolean(selectedImage && Math.min(selectedImage.naturalWidth || 0, selectedImage.naturalHeight || 0) < 500);

  const commit = useCallback((nextSides) => {
    setHistory((current) => ({
      past: [...current.past.slice(-39), current.present],
      present: nextSides,
      future: []
    }));
  }, []);

  const commitElements = useCallback((nextElements) => {
    commit({ ...history.present, [view]: nextElements });
  }, [commit, history.present, view]);

  const updateSelected = (changes) => {
    if (!selectedIds.length) return;
    commitElements(elements.map((element) => (
      selectedIds.includes(element.id)
        ? fitTextToPrintArea({ ...element, ...changes }, zoneForElement(element))
        : element
    )));
  };

  const undo = useCallback(() => {
    setHistory((current) => {
      if (!current.past.length) return current;
      const previous = current.past[current.past.length - 1];
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future]
      };
    });
    setSelectedIds([]);
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      if (!current.future.length) return current;
      const [next, ...future] = current.future;
      return {
        past: [...current.past, current.present],
        present: next,
        future
      };
    });
    setSelectedIds([]);
  }, []);

  useEffect(() => {
    const handleKeys = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      } else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedIds.length) {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
        event.preventDefault();
        commitElements(elements.filter((element) => !selectedIds.includes(element.id)));
        setSelectedIds([]);
      } else if (event.key === 'Escape') {
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [commitElements, elements, redo, selectedIds, undo]);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    transformer.nodes(selectedIds
      .filter((id) => {
        const element = elements.find((item) => item.id === id);
        return element && !element.locked && element.zoneId === selectedZoneId;
      })
      .map((id) => nodeRefs.current[id])
      .filter(Boolean));
    transformer.getLayer()?.batchDraw();
  }, [selectedIds, elements, selectedZoneId]);

  const registerNode = useCallback((id, node) => {
    if (node) nodeRefs.current[id] = node;
    else delete nodeRefs.current[id];
  }, []);

  const selectElement = (id, additive) => {
    const target = elements.find((element) => element.id === id);
    if (target?.zoneId) {
      setActiveZonesBySide((current) => ({ ...current, [view]: target.zoneId }));
    }
    setSelectedIds((current) => {
      if (!target) return current;
      const sameZoneSelection = current.filter((selectedId) => (
        elements.find((element) => element.id === selectedId)?.zoneId === target.zoneId
      ));
      return additive
        ? sameZoneSelection.includes(id)
          ? sameZoneSelection.filter((item) => item !== id)
          : [...sameZoneSelection, id]
        : [id];
    });
    setActivePanel('properties');
    setPanelOpen(true);
  };

  const updateElementFromNodes = () => {
    const next = elements.map((element) => {
      const node = nodeRefs.current[element.id];
      return node
        ? {
          ...element,
          x: node.x(),
          y: node.y(),
          width: node.width(),
          height: node.height(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
          rotation: node.rotation()
        }
        : element;
    });
    commitElements(next);
  };

  const addElement = (element) => {
    setMessage('');
    const fitted = fitElementsToArea(
      [{ ...element, zoneId: selectedZoneId }],
      printArea
    ).map((item) => fitTextToPrintArea(item, printArea));
    commitElements([...elements, ...fitted]);
    setSelectedIds(fitted.map((item) => item.id));
    setActivePanel('properties');
    setPanelOpen(true);
  };

  const startPhotoUpload = (slot) => {
    pendingPhotoSlotRef.current = slot;
    if (slot.zoneId) {
      setActiveZonesBySide((current) => ({ ...current, [view]: slot.zoneId }));
    }
    setSelectedIds([slot.id]);
    uploadRef.current?.click();
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const photoSlot = pendingPhotoSlotRef.current;
    pendingPhotoSlotRef.current = null;
    if (!file) return;
    setMessage('');
    try {
      const image = await readImageFile(file);
      if (photoSlot) {
        const photoZoneId = photoSlot.zoneId || selectedZoneId;
        const photoArea = zoneFor(view, photoZoneId);
        const uploaded = makeImageElement(image, 0, photoSlot, photoZoneId);
        const fitted = fitElementsToArea([uploaded], photoArea);
        const next = elements
          .filter((element) => element.id !== photoSlot.id)
          .concat(fitted);
        commitElements(next);
        setSelectedIds(fitted.map((element) => element.id));
      } else {
        addElement(makeImageElement(image));
      }
      setActivePanel('properties');
      setPanelOpen(true);
    } catch (error) {
      if (photoSlot) setSelectedIds([photoSlot.id]);
      setMessage(error.message);
    }
  };

  const addTemplate = (templateId) => {
    const templateElements = createTemplateElements(templateId).map((element) => (
      {
        ...(element.fill === '#102a43' ? { ...element, fill: defaultInk } : element),
        zoneId: selectedZoneId
      }
    ));
    const newElements = fitElementsToArea(templateElements, printArea);
    commitElements([...elements, ...newElements]);
    setSelectedIds(newElements.map((element) => element.id));
    setActivePanel('properties');
    setPanelOpen(true);
  };

  const selectZone = (zoneId) => {
    const targetZone = zoneFor(view, zoneId);
    if (selectedIds.length) {
      const selected = elements.filter((element) => selectedIds.includes(element.id));
      const moved = fitElementsToArea(
        selected.map((element) => ({ ...element, zoneId })),
        targetZone
      );
      const movedIds = new Set(moved.map((element) => element.id));
      commitElements([
        ...elements.filter((element) => !movedIds.has(element.id)),
        ...moved
      ]);
    }
    setActiveZonesBySide((current) => ({ ...current, [view]: zoneId }));
  };

  const duplicateSelected = () => {
    const copies = elements
      .filter((element) => selectedIds.includes(element.id))
      .map((element) => ({ ...element, id: `${element.id}-copy-${Date.now()}`, x: element.x + 14, y: element.y + 14, locked: false }));
    if (!copies.length) return;
    commitElements([...elements, ...copies]);
    setSelectedIds(copies.map((element) => element.id));
  };

  const deleteSelected = () => {
    if (!selectedIds.length) return;
    commitElements(elements.filter((element) => !selectedIds.includes(element.id)));
    setSelectedIds([]);
  };

  const alignSelectedCenter = () => {
    if (selectedIds.length < 2) return;
    const selected = elements.filter((element) => selectedIds.includes(element.id));
    const minX = Math.min(...selected.map((element) => element.x));
    const maxX = Math.max(...selected.map((element) => element.x + element.width * (element.scaleX || 1)));
    const centerX = (minX + maxX) / 2;
    commitElements(elements.map((element) => selectedIds.includes(element.id)
      ? { ...element, x: centerX - (element.width * (element.scaleX || 1)) / 2 }
      : element));
  };

  const toggleLock = (id) => {
    commitElements(elements.map((element) => element.id === id ? { ...element, locked: !element.locked } : element));
  };

  const moveLayer = (id, direction) => {
    const index = elements.findIndex((element) => element.id === id);
    const nextIndex = Math.max(0, Math.min(elements.length - 1, index + direction));
    if (index < 0 || nextIndex === index) return;
    const next = [...elements];
    const [layer] = next.splice(index, 1);
    next.splice(nextIndex, 0, layer);
    commitElements(next);
  };

  const resetDesign = () => {
    if (!window.confirm('Reset the artwork on this side of the shirt?')) return;
    commitElements([]);
    setSelectedIds([]);
  };

  const makeFinalProof = async () => {
    const selectedIdsAtSave = [...selectedIds];
    const selectedElementAtSave = elements.find((element) => selectedIdsAtSave.includes(element.id));
    setIsSaving(true);
    setMessage('');
    setSelectedIds([]);
    setShowSafeArea(false);
    await nextPaint();
    const originalView = view;
    let renderedView = originalView;
    const sides = ['front', 'back'].filter((side) => (
      side === originalView || history.present[side]?.length
    ));
    const sidePreviews = {};
    for (const side of sides) {
      if (side !== renderedView) {
        setView(side);
        renderedView = side;
        await nextPaint();
      }
      if (!stageRef.current) throw new Error('The design canvas is unavailable.');
      sidePreviews[side] = stageRef.current.toDataURL({ pixelRatio: 2, mimeType: 'image/png' });
    }
    if (originalView !== renderedView) {
      setView(originalView);
      await nextPaint();
    }
    setShowSafeArea(true);

    const proofCanvas = document.createElement('canvas');
    const sideImages = await Promise.all(Object.entries(sidePreviews).map(([side, src]) => new Promise((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve({ side, image });
      image.onerror = () => reject(new Error('The design preview could not be prepared.'));
      image.src = src;
    })));
    proofCanvas.width = CANVAS_WIDTH * sideImages.length;
    proofCanvas.height = CANVAS_HEIGHT;
    const context = proofCanvas.getContext('2d');
    if (!context) throw new Error('The design preview could not be prepared.');
    context.fillStyle = '#f4f6f8';
    context.fillRect(0, 0, proofCanvas.width, proofCanvas.height);
    sideImages.forEach(({ side, image }, index) => {
      context.drawImage(image, index * CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      context.fillStyle = '#102a43';
      context.font = '600 15px Arial';
      context.fillText(side === 'front' ? 'FRONT' : 'BACK', index * CANVAS_WIDTH + 18, 26);
    });
    const originalImage = proofCanvas.toDataURL('image/png');
    const uploadedImage = Object.values(history.present).flat().find((element) => element.type === 'image')?.src || originalImage;
    const primary = selectedElementAtSave || elements[0];
    const position = primary ? {
      x: primary.x,
      y: primary.y,
      scaleX: primary.scaleX || 1,
      scaleY: primary.scaleY || 1,
      rotation: primary.rotation || 0,
      view: originalView
    } : { view: originalView };

    onSave({
      template: selectedTemplate || 'blank',
      view: originalView,
      garmentColor,
      elementsByView: history.present,
      sidePreviews,
      originalImage,
      previewImage: originalImage,
      uploadedImage,
      position,
      printArea: zoneFor(originalView, activeZonesBySide[originalView] || defaultZoneBySide[originalView]),
      placementsBySide: {
        front: zoneFor('front', activeZonesBySide.front || defaultZoneBySide.front).id,
        back: zoneFor('back', activeZonesBySide.back || defaultZoneBySide.back).id
      }
    });
    setIsSaving(false);
  };

  const handleSave = () => {
    if (!Object.values(history.present).some((sideElements) => sideElements.length > 0)) {
      setMessage('Add text, a graphic, or an image before preparing your preview.');
      setActivePanel('create');
      setPanelOpen(true);
      return;
    }
    makeFinalProof().catch((error) => {
      setShowSafeArea(true);
      setMessage(error.message || 'Could not prepare the final preview. Please try again.');
      setIsSaving(false);
    });
  };

  const handleBlankCanvasClick = (event) => {
    if (event.target === event.target.getStage()) setSelectedIds([]);
  };

  const layerList = [...elements].reverse();
  const labelFor = (element) => element.type === 'image'
    ? 'Uploaded image'
    : String(element.text || 'Design element').slice(0, 24);

  return (
    <div className={styles.studio} role="dialog" aria-modal="true" aria-label="T-shirt design studio">
      <header className={styles.topbar}>
        <div className={styles.brandBlock}>
          <button className={styles.backIcon} type="button" onClick={onCancel} aria-label="Return to product">
            <ArrowLeft size={19} />
          </button>
          <BrandLogo size="sm" className={styles.brandLogo} />
          <div className={styles.brandCopy}>
            <strong>Design studio</strong>
          </div>
        </div>
        <div className={styles.historyControls}>
          <button type="button" onClick={undo} disabled={!history.past.length} title="Undo (Ctrl+Z)" aria-label="Undo">
            <Undo2 size={17} />
          </button>
          <button type="button" onClick={redo} disabled={!history.future.length} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">
            <Redo2 size={17} />
          </button>
          <span className={styles.topDivider} />
          <button type="button" className={styles.resetButton} onClick={resetDesign}><RotateCcw size={15} /> Reset</button>
        </div>
        <button type="button" className={styles.previewTopButton} onClick={handleSave} disabled={isSaving}>
          <Eye size={16} /> {isSaving ? 'Preparing…' : 'Preview design'} <ArrowRight size={16} />
        </button>
      </header>

      <div className={styles.studioBody}>
        <aside className={styles.toolRail} aria-label="Design tools">
          {[
            { id: 'create', label: 'Add', icon: Plus },
            { id: 'templates', label: 'Templates', icon: Sparkles },
            { id: 'layers', label: 'Layers', icon: Layers }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={activePanel === id ? styles.activeTool : ''}
              onClick={() => { setActivePanel(id); setPanelOpen(true); }}
              aria-pressed={activePanel === id}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
          <div className={styles.railSpacer} />
          <button type="button" className={styles.railHint} onClick={() => setShowSafeArea((value) => !value)} aria-pressed={showSafeArea}>
            <AlignCenter size={18} /><span>Print area</span>
          </button>
        </aside>

        <aside className={`${styles.toolPanel} ${panelOpen ? styles.mobileOpen : ''}`}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.panelEyebrow}>YOUR DESIGN</span>
              <h2>{activePanel === 'create' ? 'Create' : activePanel === 'templates' ? 'Starting points' : activePanel === 'layers' ? 'Layers' : 'Selection'}</h2>
            </div>
            <button type="button" className={styles.mobilePanelClose} onClick={() => setPanelOpen(false)} aria-label="Close tools"><X size={18} /></button>
          </div>

          {activePanel === 'create' && (
            <>
              <div className={styles.createActions}>
                <button type="button" className={styles.createAction} onClick={() => { pendingPhotoSlotRef.current = null; uploadRef.current?.click(); }}>
                  <span className={styles.actionIcon}><ImagePlus size={18} /></span>
                  <span><strong>Upload image</strong><small>PNG, JPG or WEBP · up to 12 MB</small></span>
                  <Plus size={16} />
                </button>
                <button type="button" className={styles.createAction} onClick={() => addElement(createTextElement('Your text', defaultInk))}>
                  <span className={styles.actionIcon}><Type size={18} /></span>
                  <span><strong>Add text</strong><small>Personalize with your words</small></span>
                  <Plus size={16} />
                </button>
                <button type="button" className={styles.createAction} onClick={() => setActivePanel('stickers')}>
                  <span className={styles.actionIcon}><Sparkles size={18} /></span>
                  <span><strong>Graphics & symbols</strong><small>Simple print-ready accents</small></span>
                  <Plus size={16} />
                </button>
              </div>
              <div className={styles.panelNote}><FileImage size={16} /><span>Your artwork stays on this device until you submit your order.</span></div>
              <div className={styles.quickTemplateHeading}><span>Quick starts</span><button type="button" onClick={() => setActivePanel('templates')}>See all</button></div>
              <div className={styles.quickTemplates}>
                {DESIGN_TEMPLATES.slice(0, 3).map((template) => (
                  <button type="button" key={template.id} onClick={() => addTemplate(template.id)}>
                    <span>{template.elements[0]?.text}</span><small>{template.name}</small>
                  </button>
                ))}
              </div>
            </>
          )}

          {activePanel === 'templates' && (
            <>
              <label className={styles.searchField}>
                <Sparkles size={15} />
                <input value={templateSearch} onChange={(event) => setTemplateSearch(event.target.value)} placeholder="Search ideas" aria-label="Search design templates" />
              </label>
              <div className={styles.categoryChips}>
                {selectedCategories.map((category) => (
                  <button type="button" key={category} className={templateCategory === category ? styles.selectedChip : ''} onClick={() => setTemplateCategory(category)}>
                    {category}
                  </button>
                ))}
              </div>
              <div className={styles.templateList}>
                {filteredTemplates.map((template) => (
                  <button type="button" key={template.id} className={styles.templateListItem} onClick={() => addTemplate(template.id)}>
                    <span className={styles.templateThumb}>{template.elements.slice(0, 2).map((element) => <i key={element.text} style={{ color: element.fill }}>{element.text}</i>)}</span>
                    <span><small>{template.category}</small><strong>{template.name}</strong><em>{template.description}</em></span>
                    <Plus size={16} />
                  </button>
                ))}
              </div>
            </>
          )}

          {activePanel === 'layers' && (
            <>
              <div className={styles.layerPanelIntro}>
                <span>{elements.length} {elements.length === 1 ? 'layer' : 'layers'} · {view}</span>
                <button type="button" onClick={duplicateSelected} disabled={!selectedIds.length}><Copy size={15} /> Duplicate</button>
              </div>
              {!layerList.length ? (
                <div className={styles.layersEmpty}><Layers size={23} /><strong>No artwork yet</strong><span>Add text, a graphic, or an image to build your design.</span></div>
              ) : (
                <div className={styles.layerList}>
                  {layerList.map((element) => (
                    <div key={element.id} className={`${styles.layerRow} ${selectedIds.includes(element.id) ? styles.selectedLayer : ''}`}>
                      <button type="button" className={styles.layerSelect} onClick={(event) => selectElement(element.id, event.shiftKey)}>
                        {element.type === 'image' ? <ImagePlus size={16} /> : element.type === 'text' ? <Type size={16} /> : <Sparkles size={16} />}
                        <span>{labelFor(element)}</span>
                      </button>
                      <button type="button" onClick={() => toggleLock(element.id)} aria-label={element.locked ? 'Unlock layer' : 'Lock layer'}>
                        {element.locked ? <Lock size={14} /> : <Unlock size={14} />}
                      </button>
                      <button type="button" onClick={() => moveLayer(element.id, 1)} aria-label="Bring layer forward"><ArrowUp size={14} /></button>
                      <button type="button" onClick={() => moveLayer(element.id, -1)} aria-label="Send layer backward"><ArrowDown size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
              {selectedIds.length > 1 && (
                <button type="button" className={styles.alignButton} onClick={alignSelectedCenter}>
                  <AlignHorizontalJustifyCenter size={16} /> Align centers
                </button>
              )}
            </>
          )}

          {activePanel === 'stickers' && (
            <>
              <div className={styles.panelHeadingCompact}>
                <button type="button" onClick={() => setActivePanel('create')}><ArrowLeft size={15} /> Tools</button>
                <h3>Graphics & symbols</h3>
              </div>
              <div className={styles.categoryChips}>
                {['Emoji', 'Symbols', 'Badges', 'Shapes'].map((category) => (
                  <button key={category} type="button" className={stickerCategory === category ? styles.selectedChip : ''} onClick={() => setStickerCategory(category)}>{category}</button>
                ))}
              </div>
              <div className={styles.stickerGrid}>
                {(stickerCategory === 'Emoji'
                  ? ['😀', '❤️', '🔥', '🌟', '⚡', '🌈', '🎸', '🏀', '🐾', '☕', '🚀', '🌸']
                  : stickerCategory === 'Symbols'
                    ? ['★', '✳', '♥', '↗', '∞', '✦']
                    : stickerCategory === 'Badges'
                      ? ['EST.', 'CLUB', 'TEAM', 'NO. 01', 'ORIGINAL', 'SINCE']
                      : ['●', '■', '◆', '▲', '━', '◯']).map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => addElement(createStickerElement(
                      item,
                      '#000000',
                      stickerCategory === 'Emoji' ? '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif' : 'Arial'
                    ))}
                  >{item}</button>
                ))}
              </div>
              <p className={styles.helperCopy}>Clean, high-contrast shapes designed to stay legible in print.</p>
            </>
          )}

          {activePanel === 'properties' && (
            <>
              {!selectedElement ? (
                <div className={styles.layersEmpty}><Sparkles size={22} /><strong>Select an element</strong><span>Tap artwork on the shirt to edit its details.</span></div>
              ) : (
                <div className={styles.propertyControls}>
                  <div className={styles.selectedSummary}>
                    <span className={styles.actionIcon}>{selectedElement.type === 'image' ? <ImagePlus size={18} /> : selectedText ? <Type size={18} /> : <Sparkles size={18} />}</span>
                    <span><strong>{selectedText ? 'Text settings' : selectedElement.type === 'image' ? 'Image settings' : 'Graphic settings'}</strong><small>{selectedIds.length > 1 ? `${selectedIds.length} selected` : labelFor(selectedElement)}</small></span>
                  </div>

                  {selectedText && (
                    <>
                      <label className={styles.fieldLabel}>Your text
                        <textarea value={selectedElement.text} maxLength={80} onChange={(event) => updateSelected({ text: event.target.value })} rows={3} />
                      </label>
                      <label className={styles.fieldLabel}>Typeface
                        <select value={selectedElement.fontFamily || 'Arial'} onChange={(event) => updateSelected({ fontFamily: event.target.value })}>
                          {FONT_FAMILIES.map((fontFamily) => (
                            <option key={fontFamily} value={fontFamily}>{fontFamily}</option>
                          ))}
                        </select>
                      </label>
                      <div className={styles.propertyRow}>
                        <label className={styles.fieldLabel}>Size <strong>{selectedElement.fontSize}px</strong>
                          <input type="range" min="8" max="64" value={selectedElement.fontSize || 26} onChange={(event) => updateSelected({ fontSize: Number(event.target.value) })} />
                        </label>
                        <button type="button" className={styles.inlineControl} aria-label="Toggle bold" onClick={() => updateSelected({ fontStyle: selectedElement.fontStyle === 'bold' ? 'normal' : 'bold' })}>
                          <Bold size={17} />
                        </button>
                      </div>
                    </>
                  )}

                  {selectedElement.type !== 'image' && (
                    <label className={styles.fieldLabel}>Ink colour
                      <div className={styles.inkPalette}>
                        {['#102a43', '#e87524', '#ffffff', '#22272d', '#b63e3e', '#47745b'].map((colour) => (
                          <button
                            type="button"
                            key={colour}
                            className={selectedElement.fill === colour ? styles.selectedInk : ''}
                            style={{ backgroundColor: colour }}
                            onClick={() => updateSelected({ fill: colour })}
                            aria-label={`Set artwork colour ${colour}`}
                          />
                        ))}
                        <input type="color" value={/^#[0-9a-f]{6}$/i.test(selectedElement.fill || '') ? selectedElement.fill : '#102a43'} onChange={(event) => updateSelected({ fill: event.target.value })} aria-label="Choose custom ink colour" />
                      </div>
                    </label>
                  )}

                  <label className={styles.fieldLabel}>Rotation <strong>{Math.round(selectedElement.rotation || 0)}°</strong>
                    <input type="range" min="-180" max="180" value={Math.round(selectedElement.rotation || 0)} onChange={(event) => updateSelected({ rotation: Number(event.target.value) })} />
                  </label>
                  {lowResolution && <div className={styles.qualityWarning}><FileImage size={16} /><span>This image may look soft at print size. Use a higher-resolution file for a sharper result.</span></div>}
                  {outsidePrintArea && <div className={styles.boundaryWarning}><AlignCenter size={16} /><span>Part of the artwork is outside the safe print area.</span></div>}
                  <div className={styles.propertyActions}>
                    <button type="button" onClick={duplicateSelected}><Copy size={15} /> Duplicate</button>
                    {selectedIds.length > 1 && <button type="button" onClick={alignSelectedCenter}><AlignHorizontalJustifyCenter size={15} /> Align</button>}
                    <button type="button" className={styles.deleteAction} onClick={deleteSelected}><Trash2 size={15} /> Delete</button>
                  </div>
                  <div className={styles.shortcutNote}>Tip: hold Shift and select another object to align multiple layers.</div>
                </div>
              )}
            </>
          )}

          <input ref={uploadRef} className={styles.fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={uploadImage} />
          {message && <p className={styles.errorMessage} role="alert">{message}</p>}
        </aside>

        <main className={styles.workspace}>
          <div className={styles.workspaceTop}>
            <div className={styles.workspaceTitle}>
              <strong>Canvas</strong>
              <span><i /> Saved as you design</span>
            </div>
            <div className={styles.canvasControls}>
              <div className={styles.viewSwitch} aria-label="T-shirt side">
                {['front', 'back'].map((side) => (
                  <button type="button" key={side} className={view === side ? styles.activeView : ''} onClick={() => { setView(side); setSelectedIds([]); }}>
                    {side === 'front' ? 'Front' : 'Back'}
                    {!!history.present[side]?.length && <i />}
                  </button>
                ))}
              </div>
              <label className={styles.placementControl}>
                <span>Placement</span>
                <select value={selectedZoneId} onChange={(event) => selectZone(event.target.value)} aria-label="Print position">
                  {zonesBySide[view].map((zone) => (
                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                  ))}
                </select>
              </label>
              <span className={styles.topDivider} />
              <button type="button" className={styles.iconControl} onClick={() => setZoom((value) => Math.max(.72, Number((value - .08).toFixed(2))))} aria-label="Zoom out"><ZoomOut size={16} /></button>
              <span className={styles.zoomValue}>{Math.round(zoom * 100)}%</span>
              <button type="button" className={styles.iconControl} onClick={() => setZoom((value) => Math.min(1.2, Number((value + .08).toFixed(2))))} aria-label="Zoom in"><ZoomIn size={16} /></button>
              <button type="button" className={styles.iconControl} onClick={() => setZoom(1)} aria-label="Reset zoom"><FlipHorizontal size={16} /></button>
            </div>
          </div>

          <div className={styles.canvasArea}>
            <div
              className={`${styles.canvasStage} ${view === 'back' ? styles.canvasStageBack : ''} ${panelOpen ? styles.canvasStageWithPanel : ''}`}
              style={{ '--zoom': zoom, '--panel-zoom': zoom * 0.64, transform: `scale(${zoom})` }}
            >
              <Stage
                ref={stageRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onMouseDown={handleBlankCanvasClick}
                onTouchStart={handleBlankCanvasClick}
              >
                <Layer>
                  <ShirtArtwork colour={garmentColor} side={view} product={product} />
                  {showSafeArea && (
                    <>
                      <Rect
                        x={printArea.x}
                        y={printArea.y}
                        width={printArea.width}
                        height={printArea.height}
                        fill="rgba(71,85,105,0.025)"
                        stroke="#475569"
                        strokeWidth={1.25}
                        dash={[7, 5]}
                        listening={false}
                      />
                      <Text
                        x={printArea.x}
                        y={printArea.y - 22}
                        width={printArea.width}
                        text={`PRINT-SAFE · ${printArea.name.toUpperCase()}`}
                        align="center"
                        fontSize={9}
                        fontStyle="bold"
                        letterSpacing={1}
                        fill="#475569"
                        listening={false}
                      />
                    </>
                  )}
                  {elements.map((element) => (
                    <ArtworkElement
                      key={element.id}
                      element={element}
                      area={zoneForElement(element)}
                      stageRef={stageRef}
                      isSelected={selectedIds.includes(element.id)}
                      onSelect={selectElement}
                      onNode={registerNode}
                      onDragEnd={updateElementFromNodes}
                      onTransformEnd={updateElementFromNodes}
                      onPhotoPlaceholderClick={startPhotoUpload}
                    />
                  ))}
                  <Transformer
                    ref={transformerRef}
                    rotateEnabled
                    keepRatio={false}
                    borderStroke="#334155"
                    anchorStroke="#334155"
                    anchorFill="#fff"
                    anchorSize={9}
                    anchorCornerRadius={5}
                    boundBoxFunc={(oldBox, newBox) => (
                      newBox.width < 12 ||
                      newBox.height < 12 ||
                      newBox.x < printArea.x ||
                      newBox.y < printArea.y ||
                      newBox.x + newBox.width > printArea.x + printArea.width ||
                      newBox.y + newBox.height > printArea.y + printArea.height
                        ? oldBox
                        : newBox
                    )}
                  />
                </Layer>
              </Stage>
            </div>
            <div className={styles.canvasCaption}>
              <span><span className={styles.safeDot} /> Printable area</span>
              <span>Drag to position <i /> Select an object for controls</span>
            </div>
            {!elements.length && (
              <div className={styles.emptyCanvasCard}>
                <span><Sparkles size={20} /></span>
                <strong>Your canvas is ready</strong>
                <p>Upload artwork, add a line of text, or start from a template.</p>
                <button type="button" onClick={() => setActivePanel('create')}>Choose a tool <ArrowRight size={15} /></button>
              </div>
            )}
          </div>

          <footer className={styles.canvasFooter}>
            <span><Check size={15} /> {elements.length ? `${elements.length} layer${elements.length === 1 ? '' : 's'} on ${view}` : 'Blank canvas'}</span>
            {outsidePrintArea
              ? <span className={styles.footerWarning}><AlignCenter size={15} /> Artwork outside print area</span>
              : <span>Design stays within the dashed print guide</span>}
          </footer>
        </main>

        <aside className={styles.contextBar}>
          <div className={styles.contextTitle}><span>DESIGN DETAILS</span><small>{selectedIds.length ? `${selectedIds.length} selected` : 'No selection'}</small></div>
          {selectedIds.length > 1 ? (
            <div className={styles.multiSelectCard}>
              <Layers size={19} /><strong>{selectedIds.length} objects selected</strong>
              <button type="button" onClick={alignSelectedCenter}><AlignHorizontalJustifyCenter size={15} /> Align centers</button>
              <button type="button" onClick={duplicateSelected}><Copy size={15} /> Duplicate</button>
              <button type="button" className={styles.deleteAction} onClick={deleteSelected}><Trash2 size={15} /> Delete</button>
            </div>
          ) : selectedElement ? (
            <div className={styles.selectionCard}>
              <div className={styles.selectedSummary}>
                <span className={styles.actionIcon}>{selectedText ? <Type size={18} /> : selectedElement.type === 'image' ? <ImagePlus size={18} /> : <Sparkles size={18} />}</span>
                <span><strong>{selectedText ? 'Text selected' : selectedElement.type === 'image' ? 'Image selected' : 'Graphic selected'}</strong><small>{labelFor(selectedElement)}</small></span>
              </div>
              <button type="button" onClick={() => setActivePanel('properties')}>Edit properties <ArrowRight size={15} /></button>
            </div>
          ) : (
            <div className={styles.contextEmpty}>
              <span><Sparkles size={19} /></span>
              <strong>Build your print</strong>
              <p>Start with text, an image, or a template. Select any layer to fine-tune it.</p>
            </div>
          )}

          <div className={styles.productSummary}>
            <span className={styles.productSummaryLabel}>YOUR T-SHIRT</span>
            <strong>{product?.name || 'Custom T-shirt'}</strong>
            <div><span>Colour</span><span className={styles.colorSummary}><i style={{ backgroundColor: garmentFill(garmentColor) }} />{selectedColour || 'Selected'}</span></div>
            <div><span>Size</span><strong>{selectedSize || '—'}</strong></div>
            <div><span>Quantity</span><strong>{quantity}</strong></div>
            <div className={styles.summaryPrice}><span>Item total</span><strong>Rs {(Number(product?.price || 0) * quantity).toFixed(2)}</strong></div>
          </div>

          <div className={styles.checklist}>
            <span className={styles.productSummaryLabel}>PRINT CHECK</span>
            <p className={!outsidePrintArea ? styles.checkPassed : styles.checkNeedsReview}>
              {outsidePrintArea ? <X size={14} /> : <Check size={14} />}
              {outsidePrintArea ? 'Move all artwork inside the safe area' : 'Artwork stays in the print-safe area'}
            </p>
            <p className={selectedImage && !lowResolution ? styles.checkPassed : ''}>
              {selectedImage && !lowResolution ? <Check size={14} /> : <FileImage size={14} />}
              {selectedImage ? lowResolution ? 'Image quality needs review' : 'Uploaded image quality looks good' : 'Add an image for a photo print'}
            </p>
          </div>
        </aside>
      </div>

      <div className={styles.mobileDock}>
        <button type="button" onClick={() => { setActivePanel('create'); setPanelOpen(true); }}><Plus size={19} /><span>Add</span></button>
        <button type="button" onClick={() => { setActivePanel('templates'); setPanelOpen(true); }}><Sparkles size={19} /><span>Ideas</span></button>
        <button type="button" onClick={() => { setActivePanel('layers'); setPanelOpen(true); }}><Layers size={19} /><span>Layers</span></button>
        <button type="button" onClick={() => { setActivePanel('properties'); setPanelOpen(true); }}><AlignCenter size={19} /><span>Edit</span></button>
      </div>
      <button type="button" className={styles.mobileContinue} onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Preparing preview…' : 'Review design'} <ArrowRight size={17} />
      </button>
    </div>
  );
};

export default DesignEditor;
