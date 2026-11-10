import { Upload, Palette, Truck, Check, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import { useReveal } from '@/hooks/useReveal';

const steps = [
  {
    icon: Upload,
    num: '01',
    title: 'Choose Your Product',
    desc: 'Browse the collection and open a product you love.',
    color: 'orange',
  },
  {
    icon: Check,
    num: '02',
    title: 'Choose Your Options',
    desc: 'Select from the available options and set your quantity.',
    color: 'navy',
  },
  {
    icon: Palette,
    num: '03',
    title: 'Add to Your Cart',
    desc: 'Add your selected product to the cart and keep shopping if you like.',
    color: 'orange',
  },
  {
    icon: Truck,
    num: '04',
    title: 'Review and Order',
    desc: 'Enter your delivery details, review your items, and place your order.',
    color: 'navy',
  },
];

export default function HowItWorks() {
  return (
    <div className="bg-white">
      {/* hero */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-accent-500/15 blur-3xl" />
        </div>
        <div className="container-px relative mx-auto max-w-7xl py-16 lg:py-24">
          <div className="max-w-2xl">
            <span className="mb-4 inline-block text-sm font-bold uppercase tracking-widest text-orange-400">
              From browsing to checkout
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              How It
              <span className="block text-orange-500">Works</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-navy-200">
              Discover a product, choose its available options, and place your order in a few simple steps.
            </p>
          </div>
        </div>
      </section>

      {/* steps */}
      <section className="container-px mx-auto max-w-7xl py-16 lg:py-24">
        <div className="relative">
          {/* connecting line */}
          <div className="absolute left-0 right-0 top-20 hidden h-0.5 bg-gradient-to-r from-orange-200 via-navy-200 to-orange-200 lg:block" />

          <div className="grid gap-8 lg:grid-cols-4">
            {steps.map((s, i) => (
              <StepCard key={s.num} step={s} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* shopping overview */}
      <section className="bg-navy-50 py-16 lg:py-24">
        <div className="container-px mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="Your Shopping Journey"
                title="Find What You Love"
                subtitle="Explore ready-designed products and select the options that work for you."
              />
              <div className="mt-6 space-y-4">
                {[
                  'Browse products and their photos',
                  'Choose from the available options on the product page',
                  'Select your quantity and add your choice to the cart',
                  'Enter your delivery details at checkout',
                  'Review your order before placing it',
                ].map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500">
                      <Check size={14} className="text-white" />
                    </div>
                    <p className="text-navy-700">{f}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Button to="/category/all" size="lg" variant="primary">
                  Shop All Categories
                  <ArrowRight size={20} />
                </Button>
              </div>
            </div>

            <div className="rounded-3xl bg-navy-900 p-6 text-white shadow-2xl shadow-navy-900/20 sm:p-8">
              <p className="text-sm font-bold uppercase tracking-widest text-orange-400">
                Your shopping journey
              </p>
              <div className="mt-6 space-y-4">
                {[
                  { number: '01', title: 'Explore the collection', detail: 'Find a product you love.' },
                  { number: '02', title: 'Choose your options', detail: 'Select available options and quantity.' },
                  { number: '03', title: 'Review and order', detail: 'Check your cart and delivery details.' },
                ].map((item) => (
                  <div key={item.number} className="flex items-center gap-4 rounded-2xl bg-white/10 p-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 font-display font-extrabold">
                      {item.number}
                    </span>
                    <div>
                      <p className="font-display font-bold">{item.title}</p>
                      <p className="mt-1 text-sm text-navy-200">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* shopping steps */}
      <section className="container-px mx-auto max-w-7xl py-16 lg:py-24">
        <SectionHeading
          center
          eyebrow="Shop Your Way"
          title="A Clear, Connected Flow"
          subtitle="From product selection to checkout, each step is straightforward."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              name: 'Select Your Product',
              desc: 'Explore the Adviprints catalog and choose a product you love.',
              best: 'Product options',
            },
            {
              name: 'Choose Your Options',
              desc: 'Select the available options and quantity, then add your product to the cart.',
              best: 'Your selection',
            },
            {
              name: 'Review and Checkout',
              desc: 'Enter your delivery details and review your order before placing it.',
              best: 'Simple checkout',
            },
          ].map((m, i) => (
            <PrintMethod key={m.name} method={m} index={i} />
          ))}
        </div>
      </section>

      {/* checkout handoff */}
      <section className="bg-navy-900 py-16 lg:py-24">
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading
            center
            eyebrow="Before You Continue"
            title="Review Your Order"
            className="[&_h2]:text-white [&_p]:text-navy-200 [&_span]:text-orange-400"
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { day: 'Product', title: 'Your Selection', desc: 'Confirm the product you chose from the catalog.' },
              { day: 'Options', title: 'Size and Colour', desc: 'Check the available variant selected for your order.' },
              { day: 'Quantity', title: 'Order Amount', desc: 'Confirm how many items you want to order.' },
              { day: 'Delivery', title: 'Delivery Details', desc: 'Check your contact and delivery information.' },
            ].map((t, i) => (
              <div key={i} className="rounded-2xl border border-navy-700 bg-navy-800 p-5 text-center">
                <span className="font-display text-sm font-bold text-orange-400">{t.day}</span>
                <h4 className="mt-2 font-display text-base font-bold text-white">{t.title}</h4>
                <p className="mt-2 text-sm text-navy-300">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-px mx-auto max-w-7xl py-16 text-center">
        <h2 className="font-display text-3xl font-bold text-navy-900 sm:text-4xl">
          Ready to Find Your Favourites?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-navy-500">
          Browse the collection, choose your favourites, and place your order.
        </p>
        <div className="mt-8 flex justify-center">
          <Button to="/category/all" size="lg" variant="primary">
            Shop Now
            <ArrowRight size={20} />
          </Button>
        </div>
      </section>
    </div>
  );
}

function StepCard({ step, index }: { step: typeof steps[number]; index: number }) {
  const { ref, visible } = useReveal();
  const isOrange = step.color === 'orange';

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} relative`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className={`relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg ${
        isOrange ? 'bg-orange-500 shadow-orange-500/30' : 'bg-navy-800 shadow-navy-800/30'
      }`}>
        <step.icon size={32} className="text-white" />
        <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white font-display text-xs font-extrabold text-navy-800 shadow-md">
          {step.num}
        </span>
      </div>
      <h3 className="mt-5 text-center font-display text-lg font-bold text-navy-900">{step.title}</h3>
      <p className="mt-2 text-center text-sm leading-relaxed text-navy-600">{step.desc}</p>
    </div>
  );
}

function PrintMethod({ method, index }: { method: { name: string; desc: string; best: string }; index: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} rounded-2xl border border-navy-100 p-6 transition-all hover:shadow-xl hover:shadow-navy-900/5`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <h3 className="font-display text-lg font-bold text-navy-900">{method.name}</h3>
      <p className="mt-3 text-sm leading-relaxed text-navy-600">{method.desc}</p>
      <p className="mt-4 rounded-lg bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
        {method.best}
      </p>
    </div>
  );
}
