import { Target, Heart, Users, Award, TrendingUp, Palette, ShoppingBag } from 'lucide-react';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import { useReveal } from '@/hooks/useReveal';

export default function About() {
  return (
    <div className="bg-white">
      {/* hero */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent-500/15 blur-3xl" />
        </div>
        <div className="container-px relative mx-auto max-w-7xl py-16 lg:py-24">
          <div className="max-w-2xl">
            <span className="mb-4 inline-block text-sm font-bold uppercase tracking-widest text-orange-400">
              Our Story
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Quality T-Shirts,
              <span className="block text-orange-500">Made for Everyone</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-navy-200">
              Adviprints brings product selection and personalized printing together in one simple storefront.
            </p>
          </div>
        </div>
      </section>

      {/* image section */}
      <section className="container-px mx-auto max-w-7xl py-16 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl">
            <img
              src="https://images.pexels.com/photos/7675029/pexels-photo-7675029.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
              alt="T-shirt printing process"
              className="w-full object-cover"
            />
          </div>
          <div>
            <SectionHeading
              eyebrow="How It Works"
              title="Product Selection Meets Custom Design"
            />
            <div className="mt-5 space-y-4 text-navy-600 leading-relaxed">
              <p>
                Choose a product from the catalog, add your own artwork or text, and review the design before placing an order.
              </p>
              <p>
                The storefront is designed to make product options and the customization process clear from selection through checkout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* values */}
      <section className="bg-navy-50 py-16 lg:py-24">
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading
            center
            eyebrow="What Drives Us"
            title="Our Core Values"
            subtitle="The principles that guide every t-shirt we print."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ShoppingBag, title: 'Live Product Catalog', desc: 'Products, prices, colours, and configured sizes are loaded from the Adviprints catalog.' },
              { icon: Palette, title: 'Design Your Print', desc: 'Choose a print layout, upload artwork or add text, then adjust and preview the design.' },
              { icon: Award, title: 'Order Handoff', desc: 'The selected product, variants, quantity, and design are included in the order request.' },
              { icon: Heart, title: 'Artwork Privacy', desc: 'Customer design files are handled by the existing private order-artwork storage flow.' },
              { icon: Target, title: 'Clear Choices', desc: 'Only product options configured in the catalog are offered during customization.' },
              { icon: TrendingUp, title: 'One Connected Flow', desc: 'Continue from product details through customization, review, and checkout.' },
            ].map((v, i) => (
              <ValueCard key={v.title} value={v} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* team */}
      <section className="container-px mx-auto max-w-7xl py-16 lg:py-24">
        <SectionHeading
          center
          eyebrow="Your Order"
          title="From Catalog to Checkout"
          subtitle="A connected path from choosing a real product to submitting its custom design."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShoppingBag, title: 'Choose', desc: 'Browse products and their available options.' },
            { icon: Palette, title: 'Customize', desc: 'Place uploaded artwork or text in the print area.' },
            { icon: Award, title: 'Review', desc: 'Check the generated T-shirt design preview.' },
            { icon: Users, title: 'Order', desc: 'Enter delivery details and submit the order.' },
          ].map((value, i) => (
            <ValueCard key={value.title} value={value} index={i} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-900 py-16 lg:py-20">
        <div className="container-px mx-auto max-w-7xl text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Join the Adviprints Family
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-navy-200">
            Choose a product and create a design that is yours.
          </p>
          <div className="mt-8 flex justify-center">
            <Button to="/category/all" size="lg" variant="primary">
              Shop Now
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ValueCard({ value, index }: { value: { icon: typeof Award; title: string; desc: string }; index: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-navy-900/5`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
        <value.icon size={26} />
      </div>
      <h3 className="font-display text-lg font-bold text-navy-900">{value.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-navy-600">{value.desc}</p>
    </div>
  );
}
