import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Search, Sparkles, X } from 'lucide-react';
import { DESIGN_TEMPLATES, TEMPLATE_CATEGORIES } from './designLibrary';
import styles from './TemplateSelector.module.css';

const TemplateSelector = ({
  product,
  selectedTemplate,
  onSelectTemplate,
  onConfirm,
  onCancel
}) => {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const filteredTemplates = useMemo(() => DESIGN_TEMPLATES.filter((template) => (
    (category === 'All' || template.category === category) &&
    `${template.name} ${template.description} ${template.category}`.toLowerCase().includes(query.toLowerCase())
  )), [category, query]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalOverflow; };
  }, []);

  return (
    <div className={styles.templateOverlay}>
      <section className={styles.templateModal} role="dialog" aria-modal="true" aria-labelledby="starter-title">
        <header className={styles.templateHeader}>
          <button type="button" className={styles.backButton} onClick={onCancel}>
            <ArrowLeft size={17} /> Back to product
          </button>
          <button type="button" className={styles.closeButton} aria-label="Close template picker" onClick={onCancel}>
            <X size={20} />
          </button>
          <div className={styles.heading}>
            <span className={styles.eyebrow}><Sparkles size={14} /> START WITH AN IDEA</span>
            <h2 id="starter-title">Make it yours.</h2>
            <p>Choose a starting point for <strong>{product?.name || 'your T-shirt'}</strong>. Every word and element stays editable.</p>
          </div>
          <label className={styles.searchBox}>
            <Search size={17} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a design idea"
              aria-label="Search templates"
            />
          </label>
        </header>

        <nav className={styles.categories} aria-label="Template categories">
          {TEMPLATE_CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              className={category === item ? styles.activeCategory : ''}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className={styles.templateGrid}>
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              className={`${styles.templateCard} ${selectedTemplate === template.id ? styles.selected : ''}`}
              onClick={() => onSelectTemplate(template.id)}
              aria-pressed={selectedTemplate === template.id}
            >
              <span className={styles.previewArt}>
                {template.elements.map((element, index) => (
                  <span
                    key={`${template.id}-${index}`}
                    className={element.type === 'sticker' ? styles.previewAccent : styles.previewText}
                    style={{
                      fontSize: `clamp(10px, ${Math.min(element.fontSize / 2.3, 22)}px, 22px)`,
                      color: element.fill === '#d9e2ec' ? '#9fb3c8' : element.fill
                    }}
                  >
                    {element.text}
                  </span>
                ))}
                {selectedTemplate === template.id && <span className={styles.selectedMark}><Check size={15} /></span>}
              </span>
              <span className={styles.templateInfo}>
                <span className={styles.templateMeta}>{template.category}</span>
                <strong>{template.name}</strong>
                <span>{template.description}</span>
              </span>
            </button>
          ))}
          {!filteredTemplates.length && (
            <p className={styles.emptyState}>No starting points match that search. Try another word or category.</p>
          )}
        </div>

        <footer className={styles.templateActions}>
          <button type="button" className={styles.startBlank} onClick={() => { onSelectTemplate('blank'); onConfirm(); }}>
            Start with a blank canvas
          </button>
          <button
            type="button"
            className={styles.btnConfirm}
            onClick={onConfirm}
            disabled={!selectedTemplate || selectedTemplate === 'blank'}
          >
            Open design studio <ArrowRight size={17} />
          </button>
        </footer>
      </section>
    </div>
  );
};

export default TemplateSelector;
