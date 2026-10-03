import React from 'react';
import { motion } from 'framer-motion';
import './HowItWorks.css';

const STEPS = [
  { id: 's1', title: 'Choose & Customize', desc: 'Upload your design and personalize your T-Shirt or Mug.', icon: 'upload' },
  { id: 's2', title: 'Preview Your Design', desc: 'Review your customization before placing the order.', icon: 'preview' },
  { id: 's3', title: 'Place Your Order', desc: 'Complete checkout using our secure ordering process.', icon: 'checkout' },
  { id: 's4', title: 'We Print & Deliver', desc: 'We professionally print your product and deliver it to your doorstep.', icon: 'truck' }
];

const Icon = ({ name }) => {
  switch (name) {
    case 'upload':
      return (
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none"><path d="M12 3v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="15" width="18" height="6" rx="1" stroke="currentColor" strokeWidth="1.6"/></svg>
      );
    case 'edit':
      return (
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none"><path d="M3 21l3-1 11-11 1-3-3 1L4 20z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      );
    case 'preview':
      return (
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.4"/></svg>
      );
    case 'checkout':
      return (
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none"><path d="M3 6h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M6 6l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
      );
    case 'truck':
      return (
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none"><rect x="1" y="3" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M15 8h4l4 4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="19" r="1" fill="currentColor"/><circle cx="18" cy="19" r="1" fill="currentColor"/></svg>
      );
    default:
      return null;
  }
};

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};

const card = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 160, damping: 18 } },
  hover: { y: -8, boxShadow: '0 26px 50px rgba(11,45,92,0.08)' }
};

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="how-section">
      <div className="how-inner">
        <div className="how-head">
          <h2>How It Works</h2>
          <p className="how-sub">Create your custom T-shirt or mug in just a few simple steps.</p>
        </div>

        <motion.div className="how-flow" variants={container} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
          {STEPS.map((s, idx) => (
            <motion.article key={s.id} className="how-card" variants={card} whileHover="hover" tabIndex={0} role="group" aria-labelledby={`${s.id}-title`}>
              <div className="how-badge">{`${idx+1}`}</div>
              <div className="how-icon" aria-hidden>
                <Icon name={s.icon} />
              </div>
              <div className="how-content">
                <h3 id={`${s.id}-title`}>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </motion.article>
          ))}
        </motion.div>

        {/* trust / feature cards removed per request */}

        {/* CTA removed per request */}
      </div>
    </section>
  );
};

export default HowItWorks;
