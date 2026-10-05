import { Upload, Palette, Truck, Check, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import { useReveal } from '@/hooks/useReveal';

const steps = [
  {
    icon: Upload,
    num: '01',
    title: 'Choose Your T-Shirt',
    desc: 'Browse the available products and open the t-shirt you want to customize.',
    color: 'orange',
  },
  {
    icon: Check,
    num: '02',
    title: 'Choose Your Options',
    desc: 'Select an available size and colour, then set the quantity for your order.',
    color: 'navy',
  },
  {
    icon: Palette,
    num: '03',
    title: 'Place and Edit Your Design',
    desc: 'Choose a print area, upload your artwork, and position it in the design editor.',
    color: 'orange',
  },
  {
    icon: Truck,
    num: '04',
    title: 'Review and Continue',
    desc: 'Check the design preview and your product options, then continue to checkout to place your order.',
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
              From product to preview
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              How It
              <span className="block text-orange-500">Works</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-navy-200">
              Choose a product, customize it with your artwork, and review your design before continuing to checkout.
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

      {/* design tool showcase */}
      <section className="bg-navy-50 py-16 lg:py-24">
        <div className="container-px mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="Your Customization Flow"
                title="Make the Design Yours"
                subtitle="Use the original Adviprints design editor to place and adjust your artwork on the selected t-shirt."
              />
              <div className="mt-6 space-y-4">
                {[
                  'Choose from the print areas available in the customization flow',
                  'Upload your own artwork in the design editor',
                  'Adjust and position your artwork before previewing it',
                  'Review your selected product options with the design',
                  'Continue to the existing checkout to submit your order',
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
                  Shop All T-Shirts
                  <ArrowRight size={20} />
                </Button>
              </div>
            </div>

            <div className="rounded-3xl bg-navy-900 p-6 text-white shadow-2xl shadow-navy-900/20 sm:p-8">
              <p className="text-sm font-bold uppercase tracking-widest text-orange-400">
                Your design journey
              </p>
              <div className="mt-6 space-y-4">
                {[
                  { number: '01', title: 'Choose a print area', detail: 'Select centered or chest placement.' },
                  { number: '02', title: 'Upload and adjust', detail: 'Position your artwork in the editor.' },
                  { number: '03', title: 'Review the preview', detail: 'Check your design before checkout.' },
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

      {/* customization steps */}
      <section className="container-px mx-auto max-w-7xl py-16 lg:py-24">
        <SectionHeading
          center
          eyebrow="Customize Your Product"
          title="A Clear, Connected Flow"
          subtitle="Your product choices lead directly into the original customization and preview experience."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              name: 'Select Your Product',
              desc: 'Start with a real product from the Adviprints catalog, then choose an available size, colour, and quantity.',
              best: 'Product options',
            },
            {
              name: 'Customize the Artwork',
              desc: 'Choose a print area and use the design editor to upload, position, and adjust your artwork.',
              best: 'Original design editor',
            },
            {
              name: 'Preview and Checkout',
              desc: 'Review the customized design, then continue to the existing order checkout.',
              best: 'Order handoff',
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
              { day: 'Product', title: 'Selected T-Shirt', desc: 'Confirm the product you chose from the catalog.' },
              { day: 'Options', title: 'Size and Colour', desc: 'Check the available variant selected for your order.' },
              { day: 'Quantity', title: 'Order Amount', desc: 'Confirm how many items you want to order.' },
              { day: 'Design', title: 'Artwork Preview', desc: 'Review your customized design before checkout.' },
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
          Ready to Customize a T-Shirt?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-navy-500">
          Browse the available products and start your design from the product page.
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
