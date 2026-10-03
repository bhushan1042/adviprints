import React, { useEffect, useMemo, useState } from 'react';
import ImageCarousel from '../../../components/common/ImageCarousel';
import ProductShowcase from '../../../components/common/ProductShowcase';
import HowItWorks from '../../../components/common/HowItWorks';
import FaqSection from '../../../components/common/FaqSection';
import Footer from '../../../components/layout/Footer';
import api, { isRequestAborted } from '../../../services/api';
import { resolveImageUrl, TSHIRT_TEMPLATE_URL } from '../../../utils/images';
import categoryPlaceholder from '../../../assets/placeholders/category-placeholder.png';
import iconCustomize from '../../../assets/illustrations/customize.svg';
import iconDelivery from '../../../assets/illustrations/delevery.svg';
import iconSecure from '../../../assets/illustrations/Secure.svg';
import iconQuality from '../../../assets/illustrations/svg-1.svg';
import './Homepage.css';

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && Array.isArray(value.value)) {
    return value.value;
  }

  return [];
};

const slugify = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const mapCategory = (item, index) => {
  if (!item) {
    return { id: `c-${index}`, name: 'Unknown', image: categoryPlaceholder };
  }

  return {
    id: item._id || item.id || `c-${index}`,
    slug: item.slug || slugify(item.name),
    name: item.name || item.title || `Category ${index + 1}`,
    description: item.description || '',
    image: resolveImageUrl(item.imageUrl || item.bannerImageUrl || item.image, categoryPlaceholder),
    bannerImageUrl: item.bannerImageUrl || item.banner || null,
    showcaseTitle: item.showcaseTitle || '',
    showcaseSubtitle: item.showcaseSubtitle || '',
    showcaseFeatures: Array.isArray(item.showcaseFeatures)
      ? item.showcaseFeatures
      : typeof item.showcaseFeatures === 'string'
        ? item.showcaseFeatures.split('\n').map((entry) => entry.trim()).filter(Boolean)
        : [],
    showcaseCtaText: item.showcaseCtaText || '',
  };
};

const IndexPage = () => {
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const loadHomepageData = async () => {
      try {
        const [categoriesResponse, promotionsResponse] = await Promise.all([
          api.get('/categories', { signal: controller.signal }),
          api.get('/promotions', { signal: controller.signal }),
        ]);

        if (ignore) {
          return;
        }

        setCategories(normalizeList(categoriesResponse.data).map(mapCategory));
        setPromotions(normalizeList(promotionsResponse.data));
      } catch (error) {
        if (!ignore && !isRequestAborted(error)) {
          setCategories([]);
          setPromotions([]);
        }
      }
    };

    loadHomepageData();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !document) {
      return undefined;
    }

    const selectors = [
      '.hero-carousel',
      '.why-adviprints',
      '#start-customizing',
      '.product-showcase',
      '.trust-grid',
      '.how-steps',
      '.faq',
      '.promo-strip',
      '.footer-inner',
    ];
    const nodes = [];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        element.classList.add('reveal-on-scroll');
        nodes.push(element);
      });
    });

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            currentObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  const tshirtCategory = useMemo(() => {
    return categories.find((category) => /t-?shirts?/i.test(category.name || '')) || null;
  }, [categories]);

  const getCategoryPath = (category) => {
    if (!category) {
      return '/category';
    }

    return `/category/${encodeURIComponent(category.slug || category.id)}`;
  };

  return (
    <div className="homepage">
      <ImageCarousel />

      <section className="section-white why-adviprints">
        <div className="inner">
          <h2>Why Choose AdviPrints</h2>
          <div className="trust-grid four-up">
            <div className="trust-card">
              <img src={iconQuality} className="trust-icon" alt="Premium Materials" />
              <div>
                <h3>Premium Materials</h3>
                <p>Comfortable and durable products.</p>
              </div>
            </div>
            <div className="trust-card">
              <img src={iconCustomize} className="trust-icon" alt="High Quality Printing" />
              <div>
                <h3>High Quality Printing</h3>
                <p>Sharp, vibrant, long-lasting prints.</p>
              </div>
            </div>
            <div className="trust-card">
              <img src={iconDelivery} className="trust-icon" alt="Fast Delivery" />
              <div>
                <h3>Fast Delivery</h3>
                <p>Quick production and shipping.</p>
              </div>
            </div>
            <div className="trust-card">
              <img src={iconSecure} className="trust-icon" alt="Secure Checkout" />
              <div>
                <h3>Secure Checkout</h3>
                <p>Safe and reliable payment process.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container">
        <section id="start-customizing" className="section-white">
          <div className="inner">
            <ProductShowcase
              title={(tshirtCategory && tshirtCategory.showcaseTitle) || 'Custom T-Shirt Printing'}
              subtitle={(tshirtCategory && (tshirtCategory.showcaseSubtitle || tshirtCategory.description)) || 'Premium quality custom printed t-shirts for businesses, events and personal use.'}
              features={
                tshirtCategory?.showcaseFeatures?.length
                  ? tshirtCategory.showcaseFeatures
                  : ['Soft and comfortable fabric', 'Vibrant long-lasting prints', 'Multiple size options']
              }
              buttonText={(tshirtCategory && tshirtCategory.showcaseCtaText) || 'Design Your T-Shirt'}
              imageSrc={resolveImageUrl(tshirtCategory?.image || tshirtCategory?.bannerImageUrl, TSHIRT_TEMPLATE_URL)}
              actionRoute={getCategoryPath(tshirtCategory)}
              reverse={false}
            />
          </div>
        </section>

        <HowItWorks />
        <FaqSection />

        {promotions.length > 0 ? (
          <section className="promo-strip section-white">
            <div className="inner">
              {promotions.map((promotion) => (
                <div className="promo" key={promotion._id || promotion.title}>
                  <strong>{promotion.title}</strong>
                  <span>{promotion.description}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
};

export default IndexPage;
