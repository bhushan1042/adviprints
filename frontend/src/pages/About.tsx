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
              Products to Love,
              <span className="block text-orange-500">Made for You</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-navy-200">
              Adviprints brings a collection of ready-designed products together in one simple storefront.
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
              title="Discover Your Next Favourite"
            />
            <div className="mt-5 space-y-4 text-navy-600 leading-relaxed">
              <p>
                Explore the catalog, choose a product you love, and select from its available options.
              </p>
              <p>
                Our storefront makes it easy to review your choices and place an order.
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
            subtitle="A shopping experience built around clear choices and easy ordering."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ShoppingBag, title: 'Live Product Catalog', desc: 'Products, prices, colours, and configured sizes are loaded from the Adviprints catalog.' },
              { icon: Palette, title: 'Ready to Discover', desc: 'Explore a collection of products with designs already selected.' },
              { icon: Award, title: 'Order with Confidence', desc: 'Review your selected items and quantities before placing your order.' },
              { icon: Heart, title: 'Here to Help', desc: 'Contact us if you have questions about a product or an order.' },
              { icon: Target, title: 'Clear Choices', desc: 'See the available options on each product page.' },
              { icon: TrendingUp, title: 'Simple Checkout', desc: 'Continue from your cart to delivery details and order review.' },
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
          subtitle="A simple path from discovering products to placing an order."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShoppingBag, title: 'Choose', desc: 'Browse products and their available options.' },
            { icon: Palette, title: 'Select', desc: 'Choose the available options and quantity.' },
            { icon: Award, title: 'Review', desc: 'Check your cart and delivery details.' },
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
            Find something you love in the Adviprints collection.
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
