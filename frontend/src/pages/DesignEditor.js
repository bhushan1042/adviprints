import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import styles from './DesignEditor.module.css';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 650;

// T-shirt template configurations with REAL T-shirt images
const TEMPLATES = {
  centered: {
    name: 'Centered Print',
    image: '/images/tshirt-template.jpg',
    printArea: { x: 130, y: 150, width: 240, height: 350 },
    defaultPosition: { x: 250, y: 325, width: 180, height: 180 }
  },
  chest: {
    name: 'Chest Pocket',
    image: '/images/tshirt-template.jpg',
    printArea: { x: 275, y: 180, width: 120, height: 120 },
    defaultPosition: { x: 335, y: 240, width: 100, height: 100 }
  }
};

const DesignEditor = ({ onSave, onCancel, selectedTemplate = 'centered' }) => {
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const transformerRef = useRef(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImageObj] = useImage(uploadedImage);
  const [tshirtImage] = useImage(TEMPLATES[selectedTemplate].image);
  const [isSelected, setIsSelected] = useState(false);

  const template = TEMPLATES[selectedTemplate];

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target.result);
      setIsSelected(true);
    };
    reader.readAsDataURL(file);
  };

  // Select/deselect image for transformation
  const handleImageClick = (e) => {
    e.cancelBubble = true;
    setIsSelected(true);
  };

  // Update transformer when selection changes
  useEffect(() => {
    if (isSelected && imageRef.current && transformerRef.current && uploadedImageObj) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected, uploadedImageObj]);

  // Enforce boundaries during drag
  const handleDragMove = (e) => {
    const node = e.target;
    const printArea = template.printArea;
    
    if (node.x() < printArea.x) {
      node.x(printArea.x);
    }
    if (node.y() < printArea.y) {
      node.y(printArea.y);
    }
    if (node.x() + node.width() * node.scaleX() > printArea.x + printArea.width) {
      node.x(printArea.x + printArea.width - node.width() * node.scaleX());
    }
    if (node.y() + node.height() * node.scaleY() > printArea.y + printArea.height) {
      node.y(printArea.y + printArea.height - node.height() * node.scaleY());
    }
  };

  // Enforce boundaries after transformation
  const handleTransformEnd = (e) => {
    const node = e.target;
    const printArea = template.printArea;

    // Keep within boundaries
    let newX = Math.max(
      printArea.x,
      Math.min(node.x(), printArea.x + printArea.width - node.width() * node.scaleX())
    );
    let newY = Math.max(
      printArea.y,
      Math.min(node.y(), printArea.y + printArea.height - node.height() * node.scaleY())
    );

    node.x(newX);
    node.y(newY);
  };

  // Export canvas to images
  const handleSave = async () => {
    if (!stageRef.current || !uploadedImageObj) {
      alert('Please upload an image first');
      return;
    }

    try {
      // Detach transformer for clean export
      if (transformerRef.current) {
        transformerRef.current.detach();
      }

      const stage = stageRef.current;
      
      // Generate design canvas image (including T-shirt background)
      const originalDataUrl = stage.toDataURL({ pixelRatio: 2 });

      // Generate preview image (same as original for now, can be customized later)
      const previewDataUrl = stage.toDataURL({ pixelRatio: 2 });

      const canvasData = {
        template: selectedTemplate,
        originalImage: originalDataUrl,
        previewImage: previewDataUrl,
        uploadedImage: uploadedImage,
        position: {
          x: imageRef.current.x(),
          y: imageRef.current.y(),
          scaleX: imageRef.current.scaleX(),
          scaleY: imageRef.current.scaleY(),
          rotation: imageRef.current.rotation()
        },
        printArea: template.printArea
      };

      onSave(canvasData);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save design. Please try again.');
    }
  };

  // Show upload interface if no image selected
  if (!uploadedImage) {
    return (
      <div className={styles.uploadContainer}>
        <div className={styles.uploadBox}>
          <div className={styles.uploadIcon}>📤</div>
          <h3>Upload Your Design</h3>
          <p>Choose an image or logo for your T-shirt</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className={styles.fileInput}
            id="imageUpload"
          />
          <label htmlFor="imageUpload" className={styles.uploadLabel}>
            Click to browse or drag & drop
          </label>
          <p className={styles.uploadHint}>
            Recommended: PNG with transparent background, at least 500x500px
          </p>
        </div>
        <button onClick={onCancel} className={styles.cancelBtn}>
          Cancel
        </button>
      </div>
    );
  }

  // Main editor with Konva
  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorHeader}>
        <h2>Design Editor - {template.name}</h2>
        <button
          className={styles.changeImageBtn}
          onClick={() => document.getElementById('imageUpload').click()}
        >
          Change Image
        </button>
        <input
          type="file"
          id="imageUpload"
          accept="image/*"
          onChange={handleImageUpload}
          className={styles.fileInput}
          style={{ display: 'none' }}
        />
      </div>

      <div className={styles.canvasWrapper}>
        <Stage
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          ref={stageRef}
          className={styles.stage}
          onClick={(e) => {
            if (e.target === e.target.getStage()) {
              setIsSelected(false);
            }
          }}
        >
          <Layer>
            {/* T-shirt background image */}
            {tshirtImage && (
              <KonvaImage
                image={tshirtImage}
                x={0}
                y={0}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                listening={false}
              />
            )}

            {/* Print area overlay (dotted rectangle showing safe zone) */}
            <Rect
              x={template.printArea.x}
              y={template.printArea.y}
              width={template.printArea.width}
              height={template.printArea.height}
              stroke="#7c3aed"
              strokeWidth={2}
              dash={[5, 5]}
              listening={false}
            />

            {/* Uploaded design image with transformation */}
            {uploadedImageObj && (
              <>
                <KonvaImage
                  ref={imageRef}
                  image={uploadedImageObj}
                  x={template.defaultPosition.x - template.defaultPosition.width / 2}
                  y={template.defaultPosition.y - template.defaultPosition.height / 2}
                  width={template.defaultPosition.width}
                  height={template.defaultPosition.height}
                  draggable
                  onClick={handleImageClick}
                  onDragMove={handleDragMove}
                  onTransformEnd={handleTransformEnd}
                />

                {/* Transformer for resize/rotate (only shown when selected) */}
                {isSelected && (
                  <Transformer
                    ref={transformerRef}
                    boundBoxFunc={(oldBox, newBox) => {
                      const printArea = template.printArea;
                      
                      // Constrain transformer box within print area
                      if (newBox.x < printArea.x) newBox.x = printArea.x;
                      if (newBox.y < printArea.y) newBox.y = printArea.y;
                      if (newBox.x + newBox.width > printArea.x + printArea.width) {
                        newBox.width = printArea.x + printArea.width - newBox.x;
                      }
                      if (newBox.y + newBox.height > printArea.y + printArea.height) {
                        newBox.height = printArea.y + printArea.height - newBox.y;
                      }
                      return newBox;
                    }}
                  />
                )}
              </>
            )}
          </Layer>
        </Stage>

        <div className={styles.instructions}>
          <p>📌 Drag to move • Corner handles to resize • Scroll wheel to rotate</p>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlsInfo}>
          <p className={styles.templateLabel}>
            <strong>Template:</strong> {template.name}
          </p>
          <p className={styles.hintText}>
            💡 Position your design inside the dotted area for optimal printing
          </p>
        </div>

        <div className={styles.actionButtons}>
          <button onClick={onCancel} className={styles.cancelBtn}>
            Cancel
          </button>
          <button onClick={handleSave} className={styles.saveBtn}>
            Preview & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignEditor;
