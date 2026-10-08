import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter, AlignHorizontalJustifyCenter, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bold,
  Check, Copy, Eye, FileImage, FlipHorizontal, ImagePlus,
  Layers, Lock, Plus, Redo2, RotateCcw, Sparkles, Trash2, Type,
  Undo2, Unlock, X, ZoomIn, ZoomOut
} from 'lucide-react';
import { Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import useImage from 'use-image';
import { DESIGN_TEMPLATES, createStickerElement, createTemplateElements, createTextElement } from './designLibrary';
import styles from './DesignEditor.module.css';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 620;
const PRINT_AREAS = {
  front: { x: 135, y: 196, width: 230, height: 240 },
  back: { x: 130, y: 190, width: 240, height: 260 }
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

const makeGarmentMockup = (image, colour) => {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const context = canvas.getContext('2d');
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
  context.moveTo(220, 108);
  context.bezierCurveTo(231, 137, 258, 157, 294, 164);
  context.bezierCurveTo(330, 157, 357, 137, 368, 108);
  context.closePath();
  context.clip('evenodd');
  context.globalCompositeOperation = 'multiply';
  context.globalAlpha = .84;
  context.fillStyle = garmentFill(colour);
  context.fillRect(0, 0, image.naturalWidth, image.naturalHeight);
  context.restore();
  return canvas;
};

const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

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

const makeImageElement = ({ src, naturalWidth, naturalHeight }, index = 0) => {
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
    locked: false
  };
};

const ShirtArtwork = ({ colour }) => {
  const [image] = useImage('/images/tshirt-template.jpg');
  const mockup = useMemo(() => image && makeGarmentMockup(image, colour), [image, colour]);
  return mockup
    ? <KonvaImage image={mockup} x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} listening={false} />
    : null;
};

const ArtworkElement = ({ element, isSelected, onSelect, onNode, onDragMove, onDragEnd, onTransformEnd }) => {
  const [image] = useImage(element.type === 'image' ? element.src : null);
  const registerNode = useCallback((node) => onNode(element.id, node), [element.id, onNode]);
  const handleSelect = (event) => {
    event.cancelBubble = true;
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
      onClick={handleSelect}
      onTap={handleSelect}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    >
      {element.type === 'image' && image && (
        <KonvaImage image={image} width={element.width} height={element.height} />
      )}
      {element.type === 'text' && (
        <Text
          text={element.text}
          width={element.width}
          height={element.height}
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
            fontFamily="Arial"
            fontStyle="bold"
            fill={element.fill || '#e87524'}
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
          stroke="#e87524"
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
  const [view, setView] = useState(initialDesign?.view || 'front');
  const [zoom, setZoom] = useState(1);
  const [activePanel, setActivePanel] = useState('create');
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [guides, setGuides] = useState([]);
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [templateCategory, setTemplateCategory] = useState('All');
  const [stickerCategory, setStickerCategory] = useState('Symbols');
  const [templateSearch, setTemplateSearch] = useState('');
  const garmentColor = selectedColour || initialDesign?.garmentColor || 'white';
  const defaultInk = isDarkGarmentColor(garmentColor) ? '#ffffff' : '#102a43';
  const starterElements = useMemo(
    () => selectedTemplate && selectedTemplate !== 'blank'
      ? createTemplateElements(selectedTemplate).map((element) => (
        element.fill === '#102a43' ? { ...element, fill: defaultInk } : element
      ))
      : [],
    [defaultInk, selectedTemplate]
  );
  const initialSides = initialDesign?.elementsByView || {
    front: initialDesign?.elements || starterElements,
    back: []
  };
  const [history, setHistory] = useState({
    past: [],
    present: {
      front: initialSides.front || [],
      back: initialSides.back || []
    },
    future: []
  });
  const elements = history.present[view] || [];
  const printArea = PRINT_AREAS[view];
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
  const outsidePrintArea = elements.some((element) => (
    element.x < printArea.x ||
    element.y < printArea.y ||
    element.x + element.width * (element.scaleX || 1) > printArea.x + printArea.width ||
    element.y + element.height * (element.scaleY || 1) > printArea.y + printArea.height
  ));
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
      selectedIds.includes(element.id) ? { ...element, ...changes } : element
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
      .filter((id) => !elements.find((element) => element.id === id)?.locked)
      .map((id) => nodeRefs.current[id])
      .filter(Boolean));
    transformer.getLayer()?.batchDraw();
  }, [selectedIds, elements]);

  const registerNode = useCallback((id, node) => {
    if (node) nodeRefs.current[id] = node;
    else delete nodeRefs.current[id];
  }, []);

  const selectElement = (id, additive) => {
    setSelectedIds((current) => additive
      ? current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      : [id]);
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
    setGuides([]);
  };

  const handleDragMove = (event) => {
    const node = event.target;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = printArea.y + printArea.height / 2;
    const nodeCenterX = node.x() + (node.width() * node.scaleX()) / 2;
    const nodeCenterY = node.y() + (node.height() * node.scaleY()) / 2;
    const nextGuides = [];
    if (Math.abs(nodeCenterX - centerX) < 7) {
      node.x(centerX - (node.width() * node.scaleX()) / 2);
      nextGuides.push({ points: [centerX, printArea.y, centerX, printArea.y + printArea.height] });
    }
    if (Math.abs(nodeCenterY - centerY) < 7) {
      node.y(centerY - (node.height() * node.scaleY()) / 2);
      nextGuides.push({ points: [printArea.x, centerY, printArea.x + printArea.width, centerY] });
    }
    setGuides(nextGuides);
  };

  const addElement = (element) => {
    setMessage('');
    commitElements([...elements, element]);
    setSelectedIds([element.id]);
    setActivePanel('properties');
    setPanelOpen(true);
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setMessage('');
    try {
      const image = await readImageFile(file);
      addElement(makeImageElement(image));
      setActivePanel('properties');
      setPanelOpen(true);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const addTemplate = (templateId) => {
    const newElements = createTemplateElements(templateId).map((element) => (
      element.fill === '#102a43' ? { ...element, fill: defaultInk } : element
    ));
    commitElements([...elements, ...newElements]);
    setSelectedIds(newElements.map((element) => element.id));
    setActivePanel('properties');
    setPanelOpen(true);
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
    setGuides([]);
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
      printArea: PRINT_AREAS[originalView]
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
          <span className={styles.brandMark}>A</span>
          <div className={styles.brandCopy}>
            <strong>Design studio</strong>
            <span>{product?.name || 'Custom T-shirt'} <i /> {selectedSize || 'Size'} · {selectedColour || 'Colour'}</span>
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
                <button type="button" className={styles.createAction} onClick={() => uploadRef.current?.click()}>
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
                {['Symbols', 'Badges', 'Shapes'].map((category) => (
                  <button key={category} type="button" className={stickerCategory === category ? styles.selectedChip : ''} onClick={() => setStickerCategory(category)}>{category}</button>
                ))}
              </div>
              <div className={styles.stickerGrid}>
                {(stickerCategory === 'Symbols' ? ['★', '✳', '♥', '↗', '∞', '✦'] : stickerCategory === 'Badges' ? ['EST.', 'CLUB', 'TEAM', 'NO. 01', 'ORIGINAL', 'SINCE'] : ['●', '■', '◆', '▲', '━', '◯']).map((item) => (
                  <button type="button" key={item} onClick={() => addElement(createStickerElement(item))}>{item}</button>
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
                          <option value="Arial">Modern sans</option>
                          <option value="Georgia">Editorial serif</option>
                          <option value="Trebuchet MS">Rounded sans</option>
                          <option value="Courier New">Typewriter</option>
                        </select>
                      </label>
                      <div className={styles.propertyRow}>
                        <label className={styles.fieldLabel}>Size <strong>{selectedElement.fontSize}px</strong>
                          <input type="range" min="12" max="64" value={selectedElement.fontSize || 26} onChange={(event) => updateSelected({ fontSize: Number(event.target.value) })} />
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
              <span className={styles.topDivider} />
              <button type="button" className={styles.iconControl} onClick={() => setZoom((value) => Math.max(.72, Number((value - .08).toFixed(2))))} aria-label="Zoom out"><ZoomOut size={16} /></button>
              <span className={styles.zoomValue}>{Math.round(zoom * 100)}%</span>
              <button type="button" className={styles.iconControl} onClick={() => setZoom((value) => Math.min(1.2, Number((value + .08).toFixed(2))))} aria-label="Zoom in"><ZoomIn size={16} /></button>
              <button type="button" className={styles.iconControl} onClick={() => setZoom(1)} aria-label="Reset zoom"><FlipHorizontal size={16} /></button>
            </div>
          </div>

          <div className={styles.canvasArea}>
            <div
              className={`${styles.canvasStage} ${panelOpen ? styles.canvasStageWithPanel : ''}`}
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
                  <ShirtArtwork colour={garmentColor} side={view} />
                  {showSafeArea && (
                    <>
                      <Rect
                        x={printArea.x}
                        y={printArea.y}
                        width={printArea.width}
                        height={printArea.height}
                        fill="rgba(232,117,36,0.035)"
                        stroke="#e87524"
                        strokeWidth={1.5}
                        dash={[7, 5]}
                        listening={false}
                      />
                      <Text
                        x={printArea.x}
                        y={printArea.y - 22}
                        width={printArea.width}
                        text="PRINT-SAFE AREA"
                        align="center"
                        fontSize={9}
                        fontStyle="bold"
                        letterSpacing={1}
                        fill="#bd5715"
                        listening={false}
                      />
                    </>
                  )}
                  {elements.map((element) => (
                    <ArtworkElement
                      key={element.id}
                      element={element}
                      isSelected={selectedIds.includes(element.id)}
                      onSelect={selectElement}
                      onNode={registerNode}
                      onDragMove={handleDragMove}
                      onDragEnd={updateElementFromNodes}
                      onTransformEnd={updateElementFromNodes}
                    />
                  ))}
                  {guides.map((guide, index) => <Line key={index} points={guide.points} stroke="#e87524" strokeWidth={1} dash={[4, 4]} listening={false} />)}
                  <Transformer
                    ref={transformerRef}
                    rotateEnabled
                    keepRatio={false}
                    borderStroke="#e87524"
                    anchorStroke="#e87524"
                    anchorFill="#fff"
                    anchorSize={9}
                    anchorCornerRadius={5}
                    boundBoxFunc={(oldBox, newBox) => newBox.width < 12 || newBox.height < 12 ? oldBox : newBox}
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
