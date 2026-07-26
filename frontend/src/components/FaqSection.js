import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './FaqSection.css';

const FAQS = [
  { id: 'q1', q: 'Can I upload my own design?', a: 'Yes. You can upload your own artwork, logo, photo, or design during customization. We support high-quality image formats to ensure the best printing results.', category: 'Customization' },
  { id: 'q2', q: 'What file formats are recommended for printing?', a: 'For the best print quality, we recommend PNG files with transparent backgrounds, high-resolution JPG images, or vector files where available.', category: 'Printing' },
  { id: 'q3', q: 'How long does delivery take?', a: 'Most custom orders are printed and dispatched within a few business days. Delivery timelines may vary depending on location and order quantity.', category: 'Delivery' },
  { id: 'q4', q: 'Will the print fade after washing?', a: 'No. We use premium-quality printing techniques and durable inks designed to withstand regular washing while maintaining vibrant colors.', category: 'Printing' },
  { id: 'q5', q: 'Can I order multiple T-shirts or mugs with different designs?', a: 'Absolutely. Each item can be customized individually, making it easy to create unique products for personal use, gifts, teams, or events.', category: 'Orders' },
  { id: 'q6', q: 'Do you offer bulk orders for businesses, events, or teams?', a: 'Yes. We provide bulk printing solutions for companies, schools, events, and organizations. Contact us for custom pricing and large-order support.', category: 'Orders' },
  { id: 'q7', q: 'Can I preview my design before ordering?', a: 'Yes. Our customization experience allows you to review your design placement and appearance before completing your order.', category: 'Customization' },
  { id: 'q8', q: 'What if my product arrives damaged?', a: 'Customer satisfaction is important to us. If your product arrives damaged or defective, contact our support team and we will work with you to resolve the issue.', category: 'Orders' }
];

const CATEGORIES = ['All', 'Orders', 'Printing', 'Delivery', 'Customization'];

const cardVariants = {
  initial: { opacity: 0, y: 6 },
  enter: { opacity: 1, y: 0 },
  hover: { y: -6, boxShadow: '0 18px 35px rgba(11,45,92,0.08)' }
};

const FaqSection = () => {
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    return FAQS.filter(f => (category === 'All' || f.category === category) && (!q || (f.q + ' ' + f.a).toLowerCase().includes(q)));
  }, [query, category]);

  return (
    <section id="faq" className="faq-section">
      <div className="faq-inner">
        <div className="faq-header">
          <div className="faq-title">Questions? We&apos;ve Got Answers.</div>
          <div className="faq-sub">Everything you need to know about custom T-shirts, mugs, printing quality, delivery, and ordering.</div>
          <div className="faq-controls">
            <div className="faq-search">
              <input aria-label="Search FAQ" placeholder="Search FAQs" value={query} onChange={e=>setQuery(e.target.value)} />
            </div>
            <div className="faq-filters" role="tablist" aria-label="FAQ categories">
              {CATEGORIES.map(cat => (
                <button key={cat} className={`filter-btn ${category===cat? 'active':''}`} onClick={() => setCategory(cat)} aria-pressed={category===cat}>{cat}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="faq-grid">
          <AnimatePresence>
            {filtered.map(item => (
              <motion.article
                key={item.id}
                className={`faq-card ${openId === item.id ? 'open' : ''}`}
                initial="initial"
                animate="enter"
                whileHover="hover"
                variants={cardVariants}
                transition={{ type: 'spring', stiffness: 260, damping: 25 }}
              >
                <header className="faq-card-head">
                  <button
                    aria-expanded={openId === item.id}
                    aria-controls={`${item.id}-body`}
                    className="faq-question"
                    onClick={() => setOpenId(openId === item.id ? null : item.id)}
                  >
                    <span className="q-text">{item.q}</span>
                    <motion.span className="q-icon" animate={{ rotate: openId === item.id ? 45 : 0 }} transition={{ duration: 0.2 }}>+</motion.span>
                  </button>
                </header>

                <AnimatePresence initial={false}>
                  {openId === item.id && (
                    <motion.div id={`${item.id}-body`} className="faq-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }}>
                      <div className="faq-answer">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        <div className="faq-help-row">
          <div className="support-card">
            <div className="support-left">
              <div className="support-illustration" aria-hidden />
            </div>
            <div className="support-right">
              <h3>Still need help?</h3>
              <p>If you can’t find your answer, our support team is ready to assist with custom orders, bulk pricing, and product issues.</p>
              <div className="support-actions">
                <a href="#contact" className="btn btn-primary">Contact Support</a>
                <a href="/help" className="btn btn-ghost">Help Center</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
