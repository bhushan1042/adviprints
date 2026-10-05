import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Category } from '@/data/products';
import categoryPlaceholder from '@/assets/placeholders/category-placeholder.png';
import {
  ArrowRight, Truck, ShieldCheck, RefreshCw, IndianRupee,
  MousePointerClick, Palette, ShoppingBag, PackageCheck,
  ChevronDown, Sparkles,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import useCatalogCategories from '@/hooks/useCatalogCategories';
import { useReveal } from '@/hooks/useReveal';
import { applyImageFallback } from '@/utils/images';

const homeFaqs = [
  {
    q: 'Can I customise my t-shirt with my own design?',
    a: 'Yes. Choose a product, select a print area, and upload an image in the design editor.',
  },
  {
    q: 'Can I review the design before ordering?',
    a: 'Yes. The customization flow shows a preview before you continue to checkout.',
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
                Custom T-Shirts,
                <span className="block text-orange-500">Made Simple</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-navy-200">
                Browse the live catalog, choose your product options, and create a custom design before checkout.
              </p>
              <div className="mt-7 flex flex-wrap gap-4">
                <Button to="/category/all" size="lg" variant="primary">
                  Shop All T-Shirts
                  <ArrowRight size={20} />
                </Button>
                <Button to="/how-it-works" size="lg" variant="outline" className="border-white/30 text-white hover:border-orange-400 hover:text-orange-400">
                  How It Works
                </Button>
              </div>
            </div>

            <div className="relative animate-scale-in">
              <div className="overflow-hidden rounded-3xl">
                <img
                  src="https://images.pexels.com/photos/2451200/pexels-photo-2451200.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Custom printed t-shirt"
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
              { icon: Truck, title: 'Order Handoff', desc: 'Review your design before checkout' },
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

      {/* CATEGORIES — large image cards */}
      <section className="bg-white py-14 lg:py-20">
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading
            center
            eyebrow="Choose Your Style"
            title="Shop by Category"
            subtitle="Browse the categories and products currently available in the Adviprints catalog."
          />

          {/* first 4 categories — large 2x2 grid */}
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {categories.slice(0, 4).map((cat, i) => (
              <CategoryCardLarge key={cat.slug} category={cat} index={i} />
            ))}
          </div>
          {categoriesError && (
            <p role="alert" className="mt-6 text-center text-sm text-error-600">{categoriesError}</p>
          )}

          {/* last category — full width banner */}
          <div className="mt-5">
            {categories.slice(4).map((cat, i) => (
              <CategoryCardWide key={cat.slug} category={cat} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-navy-50 py-14 lg:py-20">
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading
            center
            eyebrow="Simple Process"
            title="How It Works"
            subtitle="Choose a product, customize your artwork, and review it before checkout."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: MousePointerClick, num: '01', title: 'Choose Your T-Shirt', desc: 'Browse categories and select a real catalog product.' },
              { icon: ShoppingBag, num: '02', title: 'Choose Your Options', desc: 'Select a configured size, colour, and quantity.' },
              { icon: Palette, num: '03', title: 'Customize Your Design', desc: 'Choose a print area and upload and position your artwork.' },
              { icon: PackageCheck, num: '04', title: 'Review and Checkout', desc: 'Preview your design and continue to the existing checkout.' },
            ].map((step, i) => (
              <HowItWorksCard key={step.num} step={step} index={i} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button to="/how-it-works" variant="outline" size="md">
              Learn More
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE ADVIPRINTS */}
      <section className="bg-white py-14 lg:py-20">
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading
            center
            eyebrow="Why Adviprints"
            title="Why Choose Adviprints"
            subtitle="A connected catalog, customization studio, and order checkout."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: 'Live Catalog', desc: 'Products and categories are loaded from Adviprints.' },
              { icon: Palette, title: 'Design Editor', desc: 'Upload and position artwork on the selected product.' },
              { icon: Truck, title: 'Order Handoff', desc: 'Your selected options continue to checkout.' },
              { icon: ShieldCheck, title: 'Cash on Delivery', desc: 'The current checkout does not collect online payments.' },
            ].map((item, i) => (
              <WhyChooseCard key={item.title} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CUSTOM T-SHIRT CTA BANNER */}
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
                Make It Your Own
              </span>
              <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
                Create Your Custom T-Shirt
              </h2>
              <p className="mt-4 max-w-lg text-lg leading-relaxed text-navy-200">
                Choose a product, upload your artwork, and review the customized design before checkout.
              </p>
              <div className="mt-8">
                <Button to="/category/all" size="lg" variant="primary">
                  Create Your T-Shirt
                  <ArrowRight size={20} />
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-3xl shadow-2xl shadow-black/30">
                <img
                  src="https://images.pexels.com/photos/27893067/pexels-photo-27893067.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Custom t-shirt printing"
                  className="w-full object-cover"
                  onError={(event) => applyImageFallback(event, categoryPlaceholder)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-14 lg:py-20">
        <div className="container-px mx-auto max-w-3xl">
          <SectionHeading
            center
            eyebrow="Common Questions"
            title="Frequently Asked Questions"
            subtitle="Answers to questions about customization, printing, delivery, and more."
          />
          <div className="mt-10 space-y-3">
            {homeFaqs.map((faq, i) => (
              <FaqRow key={i} faq={faq} index={i} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button to="/faq" variant="outline" size="md">
              View All FAQs
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </section>

      {/* SIMPLE CTA */}
      <section className="bg-navy-50 py-14 lg:py-20">
        <div className="container-px mx-auto max-w-7xl text-center">
          <h2 className="font-display text-3xl font-bold text-navy-900 sm:text-4xl">
            Ready to Order Your T-Shirt?
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

/* — Category card: large image with overlay — */
function CategoryCardLarge({ category, index }: { category: Category; index: number }) {
  const { ref, visible } = useReveal<HTMLAnchorElement>();
  return (
    <Link
      to={`/category/${category.slug}`}
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} group relative block overflow-hidden rounded-2xl bg-navy-900 transition-transform duration-300 hover:-rotate-[0.4deg] hover:shadow-xl hover:shadow-navy-900/15`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="aspect-[16/10] overflow-hidden sm:aspect-[16/9]">
        <img
          src={category.image}
          alt={category.name}
          loading="lazy"
          className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-60"
          onError={(event) => applyImageFallback(event, categoryPlaceholder)}
        />
      </div>
      <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-7">
        <span className="self-start rounded-full bg-white/15 px-3 py-1 font-display text-sm font-bold text-white backdrop-blur-sm transition-transform duration-300 group-hover:rotate-3 group-hover:bg-orange-500">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div>
          <h3 className="font-display text-xl font-bold text-white sm:text-2xl">
            {category.name}
          </h3>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-sm text-navy-200">{category.styles}</span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-orange-400 transition-all group-hover:gap-2">
              <ArrowRight size={16} /> Shop Now
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* — Category card: wide banner for the last category — */
function CategoryCardWide({ category, index }: { category: Category; index: number }) {
  const { ref, visible } = useReveal<HTMLAnchorElement>();
  return (
    <Link
      to={`/category/${category.slug}`}
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} group relative block overflow-hidden rounded-2xl bg-navy-900 transition-transform duration-300 hover:-rotate-[0.25deg] hover:shadow-xl hover:shadow-navy-900/15`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="aspect-[16/7] overflow-hidden sm:aspect-[16/5]">
        <img
          src={category.image}
          alt={category.name}
          loading="lazy"
          className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-60"
          onError={(event) => applyImageFallback(event, categoryPlaceholder)}
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-between gap-4 p-5 sm:p-8">
        <div className="min-w-0">
          <span className="mb-2 inline-block rounded-full bg-white/15 px-3 py-1 font-display text-sm font-bold text-white backdrop-blur-sm transition-transform duration-300 group-hover:-rotate-3 group-hover:bg-orange-500">
            {String(index + 5).padStart(2, '0')}
          </span>
          <h3 className="font-display text-xl font-bold text-white sm:text-2xl">
            {category.name}
          </h3>
          <p className="mt-1 text-sm text-navy-200">{category.styles}</p>
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all group-hover:bg-orange-500 sm:inline-flex">
          Shop Now <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}

/* — How It Works card — */
function HowItWorksCard({ step, index }: { step: { icon: typeof ArrowRight; num: string; title: string; desc: string }; index: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} group rounded-2xl bg-white p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-navy-900/5`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
        <step.icon size={26} />
      </div>
      <span className="font-display text-xs font-bold uppercase tracking-wide text-orange-500">
        {step.num}
      </span>
      <h3 className="mt-1.5 font-display text-base font-bold text-navy-900">{step.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-navy-500">{step.desc}</p>
    </div>
  );
}

/* — Why Choose card — */
function WhyChooseCard({ item, index }: { item: { icon: typeof ArrowRight; title: string; desc: string }; index: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} group rounded-2xl border border-navy-100 bg-white p-6 transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-navy-900/5`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-orange-500 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
        <item.icon size={24} />
      </div>
      <h3 className="font-display text-base font-bold text-navy-900">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-navy-500">{item.desc}</p>
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
