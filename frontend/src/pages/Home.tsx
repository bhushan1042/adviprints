import { useState } from 'react';
import categoryPlaceholder from '@/assets/placeholders/category-placeholder.png';
import {
  ArrowRight, Truck, ShieldCheck, RefreshCw, IndianRupee,
  MousePointerClick, ShoppingBag, PackageCheck, SlidersHorizontal,
  Shirt, HeartHandshake, ChevronDown, Sparkles,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import CategoryCarousel from '@/components/home/CategoryCarousel';
import useCatalogCategories from '@/hooks/useCatalogCategories';
import { useReveal } from '@/hooks/useReveal';
import { applyImageFallback } from '@/utils/images';
import homeSections from '@/components/home/HomeSections.module.css';

const homeFaqs = [
  {
    q: 'How do I place an order?',
    a: 'Choose a product, select the available options and quantity, and add it to your cart before checkout.',
  },
  {
    q: 'Can I review my order before placing it?',
    a: 'Yes. You can review your selected items and delivery details before placing your order.',
  },
  {
    q: 'How do I ask about delivery?',
    a: 'Use the Contact page and include your order ID for an order-related question.',
  },
  {
    q: 'How do I choose the right size?',
    a: 'Available sizes are shown on each product page and come from the product catalog.',
  },
  {
    q: 'How do I get help with an order?',
    a: 'Contact support using the details on the Contact page and include your order ID.',
  },
];

export default function Home() {
  const { categories, error: categoriesError } = useCatalogCategories();

  return (
    <div>
      {/* HERO */}
      <section className="relative bg-navy-900 text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
        </div>

        <div className="container-px relative mx-auto max-w-7xl">
          <div className="grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-20">
            <div className="animate-fade-up">
              <h1 className="font-display text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
                Fresh prints,
                <span className="block text-orange-500">For your daily grind</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-navy-200">
                Explore our collection, choose your favourite products and available options, and order with ease.
              </p>
              <div className="mt-7 flex flex-wrap gap-4">
                <Button to="/category/all" size="lg" variant="primary">
                  Shop All Categories
                  <ArrowRight size={20} />
                </Button>
                <Button href="#how-it-works" size="lg" variant="outline" className="border-white/30 text-white hover:border-orange-400 hover:text-orange-400">
                  How It Works
                </Button>
              </div>
            </div>

            <div className="relative animate-scale-in">
              <div className="overflow-hidden rounded-3xl">
                <img
                  src="https://images.pexels.com/photos/2451200/pexels-photo-2451200.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Printed t-shirt"
                  className="w-full object-cover"
                  onError={(event) => applyImageFallback(event, categoryPlaceholder)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-b border-navy-100 bg-white">
        <div className="container-px mx-auto max-w-7xl py-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { icon: Truck, title: 'Simple Ordering', desc: 'Review your items before checkout' },
              { icon: RefreshCw, title: 'Order Support', desc: 'Help with your order' },
              { icon: ShieldCheck, title: 'Product Details', desc: 'Options shown on each product page' },
              { icon: IndianRupee, title: 'Cash on Delivery', desc: 'No online payment collection' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <f.icon size={20} />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-navy-900">{f.title}</p>
                  <p className="text-xs text-navy-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="bg-white py-14 lg:py-20">
        <div className="container-px mx-auto max-w-[1600px]">
          <SectionHeading
            center
            eyebrow="Choose Your Style"
            title="Shop by Category"
            subtitle="Browse the categories and products currently available in the Adviprints catalog."
          />

          <CategoryCarousel categories={categories} />
          {categoriesError && (
            <p role="alert" className="mt-6 text-center text-sm text-error-600">{categoriesError}</p>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className={`${homeSections.howSection} scroll-mt-24 py-14 lg:py-20`}>
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading
            center
            eyebrow="Simple Process"
            title="How It Works"
            subtitle="Find something you love and make it yours in just a few easy steps."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: MousePointerClick, title: 'Find Your Favourite', desc: 'Explore the collection and pick a product you love.' },
              { icon: SlidersHorizontal, title: 'Pick Your Fit', desc: 'Choose an available size, colour, and quantity.' },
              { icon: ShoppingBag, title: 'Add to Your Cart', desc: 'Keep shopping or head to your cart when you’re ready.' },
              { icon: PackageCheck, title: 'Place Your Order', desc: 'Enter your delivery details, review your order, and check out.' },
            ].map((step, i) => (
              <HowItWorksCard key={step.title} step={step} index={i} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button to="/category/all" variant="outline" size="md">
              Explore Categories
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE ADVIPRINTS */}
      <section className={`${homeSections.whySection} py-14 lg:py-20`}>
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading
            center
            eyebrow="Why Adviprints"
            title="Why Choose Adviprints"
            subtitle="Thoughtful choices and a simple shopping experience, from browsing to checkout."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shirt, title: 'Find Your Style', desc: 'Browse our collection and discover a product that feels like you.' },
              { icon: SlidersHorizontal, title: 'Your Size & Colour', desc: 'Choose from the options available on each product.' },
              { icon: IndianRupee, title: 'Cash on Delivery', desc: 'Place your order now and pay when it’s delivered.' },
              { icon: HeartHandshake, title: 'Here to Help', desc: 'Have a question about your order? Get in touch with us.' },
            ].map((item, i) => (
              <WhyChooseCard key={item.title} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT COLLECTION CTA BANNER */}
      <section className="relative overflow-hidden bg-navy-900 py-16 lg:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-accent-600/15 blur-3xl" />
        </div>
        <div className="container-px relative mx-auto max-w-7xl">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300">
                <Sparkles size={16} />
                Find Your Favourite
              </span>
              <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
                Find Something That Feels Like You
              </h2>
              <p className="mt-4 max-w-lg text-lg leading-relaxed text-navy-200">
                Explore our collection, pick your favourites, and choose from the available options.
              </p>
              <div className="mt-8">
                <Button to="/category/all" size="lg" variant="primary">
                  Explore the Collection
                  <ArrowRight size={20} />
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-3xl shadow-2xl shadow-black/30">
                <img
                  src="https://images.pexels.com/photos/27893067/pexels-photo-27893067.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Printed t-shirt"
                  className="w-full object-cover"
                  onError={(event) => applyImageFallback(event, categoryPlaceholder)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIMPLE CTA */}
      <section className="bg-navy-50 py-14 lg:py-20">
        <div className="container-px mx-auto max-w-7xl text-center">
          <h2 className="font-display text-3xl font-bold text-navy-900 sm:text-4xl">
            Ready to Find Your Favourites?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-navy-500">
            Browse all styles, choose your favourite, and get it delivered to your door.
          </p>
          <div className="mt-8 flex justify-center">
            <Button to="/category/all" size="lg" variant="primary">
              Shop Now
              <ArrowRight size={20} />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* — How It Works card — */
function HowItWorksCard({ step, index }: { step: { icon: typeof ArrowRight; title: string; desc: string }; index: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${homeSections.stepCard}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className={homeSections.stepIcon}>
        <step.icon size={26} aria-hidden="true" />
      </div>
      <h3 className={homeSections.cardTitle}>{step.title}</h3>
      <p className={homeSections.cardDescription}>{step.desc}</p>
    </div>
  );
}

/* — Why Choose card — */
function WhyChooseCard({ item, index }: { item: { icon: typeof ArrowRight; title: string; desc: string }; index: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${homeSections.benefitCard}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className={homeSections.benefitIcon}>
        <item.icon size={24} aria-hidden="true" />
      </div>
      <h3 className={homeSections.cardTitle}>{item.title}</h3>
      <p className={homeSections.cardDescription}>{item.desc}</p>
    </div>
  );
}

/* — FAQ row — */
function FaqRow({ faq, index }: { faq: { q: string; a: string }; index: number }) {
  const { ref, visible } = useReveal();
  const [open, setOpen] = useState(false);
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} overflow-hidden rounded-2xl border transition-all ${
        open ? 'border-orange-200 bg-orange-50/30' : 'border-navy-100 bg-white'
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-display text-sm font-bold text-navy-900 sm:text-base">{faq.q}</span>
        <ChevronDown
          size={20}
          className={`shrink-0 transition-all duration-300 ${
            open ? 'rotate-180 text-orange-500' : 'text-navy-400'
          }`}
        />
      </button>
      <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="px-5 pb-4 text-sm leading-relaxed text-navy-600">{faq.a}</p>
        </div>
      </div>
    </div>
  );
}
