import React, { useEffect } from 'react';
import styles from './TemplateSelector.module.css';

const TemplateSelector = ({
  selectedTemplate,
  onSelectTemplate,
  onConfirm,
  onCancel
}) => {
  const templates = [
    {
      id: 'centered',
      name: 'Centered Print',
      description: 'Perfect for large designs - centered on chest',
      position: 'center'
    },
    {
      id: 'chest',
      name: 'Chest Pocket Print',
      description: 'Ideal for small logos - upper chest area',
      position: 'chest'
    }
  ];

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div className={styles.templateOverlay}>
      <div className={styles.templateModal}>
        <div className={styles.templateHeader}>
          <h2>Select Design Template</h2>
          <p>Choose where to place your design on the T-shirt</p>
        </div>
        <div className={styles.templateGrid}>
          {templates.map((template) => (
            <div
              key={template.id}
              className={`${styles.templateCard} ${
                selectedTemplate === template.id ? styles.selected : ''
              }`}
              onClick={() => onSelectTemplate(template.id)}
            >
              <div className={styles.templatePreviewContainer}>
                {/* Real T-shirt template image */}
                <img
                  src="/images/tshirt-template.jpg"
                  alt="T-shirt"
                  className={styles.tshirtImage}
                />
                
                {/* Print area indicator */}
                <div
                  className={`${styles.printAreaIndicator} ${styles[template.position]}`}
                >
                  <div className={styles.printAreaBox}></div>
                  <label className={styles.printAreaLabel}>
                    {template.position === 'center' ? '📏 Print Area' : '📌 Logo Area'}
                  </label>
                </div>
              </div>
              
              <div className={styles.templateInfo}>
                <h3>{template.name}</h3>
                <p>{template.description}</p>
              </div>
              
              {selectedTemplate === template.id && (
                <div className={styles.checkmark}>✓</div>
              )}
            </div>
          ))}
        </div>
        
        <div className={styles.templateActions}>
          <button className={styles.btnCancel} onClick={onCancel}>
            Cancel
          </button>
          <button
            className={styles.btnConfirm}
            onClick={onConfirm}
            disabled={!selectedTemplate}
          >
            Continue to Editor
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
