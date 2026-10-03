import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import { TSHIRT_TEMPLATE_URL } from '../../../utils/images';
import styles from './DesignEditor.module.css';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 650;

const TEMPLATES = {
  centered: {
    name: 'Centered Print',
    image: TSHIRT_TEMPLATE_URL,
    printArea: { x: 130, y: 150, width: 240, height: 350 },
    defaultPosition: { x: 250, y: 325, width: 180, height: 180 },
  },
  chest: {
    name: 'Chest Pocket',
    image: TSHIRT_TEMPLATE_URL,
    printArea: { x: 275, y: 180, width: 120, height: 120 },
    defaultPosition: { x: 335, y: 240, width: 100, height: 100 },
  },
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

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setUploadedImage(loadEvent.target.result);
      setIsSelected(true);
    };
    reader.readAsDataURL(file);
  };

  const handleImageClick = (event) => {
    event.cancelBubble = true;
    setIsSelected(true);
  };

  useEffect(() => {
    if (isSelected && imageRef.current && transformerRef.current && uploadedImageObj) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected, uploadedImageObj]);

  const handleDragMove = (event) => {
    const node = event.target;
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

  const handleTransformEnd = (event) => {
    const node = event.target;
    const printArea = template.printArea;
    const nextX = Math.max(
      printArea.x,
      Math.min(node.x(), printArea.x + printArea.width - node.width() * node.scaleX())
    );
    const nextY = Math.max(
      printArea.y,
      Math.min(node.y(), printArea.y + printArea.height - node.height() * node.scaleY())
    );

    node.x(nextX);
    node.y(nextY);
  };

  const handleSave = async () => {
    if (!stageRef.current || !uploadedImageObj) {
      alert('Please upload an image first');
      return;
    }

    try {
      if (transformerRef.current) {
        transformerRef.current.detach();
      }

      const stage = stageRef.current;
      const originalDataUrl = stage.toDataURL({ pixelRatio: 2 });
      const previewDataUrl = stage.toDataURL({ pixelRatio: 2 });

      onSave({
        template: selectedTemplate,
        originalImage: originalDataUrl,
        previewImage: previewDataUrl,
        uploadedImage,
        position: {
          x: imageRef.current.x(),
          y: imageRef.current.y(),
          scaleX: imageRef.current.scaleX(),
          scaleY: imageRef.current.scaleY(),
          rotation: imageRef.current.rotation(),
        },
        printArea: template.printArea,
      });
    } catch (error) {
      alert('Failed to save design. Please try again.');
    }
  };

  if (!uploadedImage) {
    return (
      <div className={styles.uploadContainer}>
        <div className={styles.uploadBox}>
          <div className={styles.uploadIcon}>??</div>
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
            Click to browse or drag &amp; drop
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
          onClick={(event) => {
            if (event.target === event.target.getStage()) {
              setIsSelected(false);
            }
          }}
        >
          <Layer>
            {tshirtImage && (
              <KonvaImage image={tshirtImage} x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} listening={false} />
            )}

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

                {isSelected && (
                  <Transformer
                    ref={transformerRef}
                    boundBoxFunc={(oldBox, newBox) => {
                      const printArea = template.printArea;

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
          <p>?? Drag to move • Corner handles to resize • Scroll wheel to rotate</p>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlsInfo}>
          <p className={styles.templateLabel}>
            <strong>Template:</strong> {template.name}
          </p>
          <p className={styles.hintText}>
            ?? Position your design inside the dotted area for optimal printing
          </p>
        </div>

        <div className={styles.actionButtons}>
          <button onClick={onCancel} className={styles.cancelBtn}>
            Cancel
          </button>
          <button onClick={handleSave} className={styles.saveBtn}>
            Preview &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignEditor;
