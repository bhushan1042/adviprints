import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Youtube, Mail } from 'lucide-react';
import useCatalogCategories from '@/hooks/useCatalogCategories';
import BrandLogo from '@/components/ui/BrandLogo';

export default function Footer() {
  const { categories, error: categoriesError } = useCatalogCategories();

  return (
    <footer className="bg-navy-950 text-navy-300">
      {/* CTA strip */}
      <div className="border-b border-navy-800">
        <div className="container-px mx-auto max-w-7xl py-12">
          <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <div>
              <h3 className="font-display text-2xl font-bold text-white">
                Ready to order your t-shirt?
              </h3>
              <p className="mt-1 text-navy-400">
                Browse the catalog and customize a product to get started.
              </p>
            </div>
            <Link
              to="/category/all"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-7 py-3.5 font-display font-semibold text-white transition-all hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/30 active:scale-95"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>

      {/* main footer */}
      <div className="container-px mx-auto max-w-7xl py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex rounded-xl bg-white p-2 transition-transform duration-300 hover:scale-[1.02]">
              <BrandLogo size="md" className="max-w-[220px]" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-navy-400">
              Browse available products, customize your artwork, and continue through checkout.
            </p>
            <div className="mt-5 flex gap-3">
              {[
                { icon: Instagram, label: 'Instagram' },
                { icon: Twitter, label: 'Twitter' },
                { icon: Facebook, label: 'Facebook' },
                { icon: Youtube, label: 'YouTube' },
              ].map((s) => (
                <span
                  key={s.label}
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-800 text-navy-300"
                >
                  <s.icon size={17} />
                </span>
              ))}
            </div>
          </div>

          {/* shop */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wide text-white">
              Shop
            </h4>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              <li><Link to="/category/all" className="transition-colors hover:text-orange-400">All T-Shirts</Link></li>
              {categories.slice(0, 4).map((cat) => (
                <li key={cat.slug}>
                  <Link to={`/category/${cat.slug}`} className="transition-colors hover:text-orange-400">
                    {cat.name}
                  </Link>
                </li>
              ))}
              {categoriesError && <li className="text-xs text-orange-300">{categoriesError}</li>}
            </ul>
          </div>

          {/* company */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wide text-white">
              Company
            </h4>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              <li><Link to="/about" className="transition-colors hover:text-orange-400">About Us</Link></li>
              <li><Link to="/how-it-works" className="transition-colors hover:text-orange-400">How It Works</Link></li>
              <li><Link to="/faq" className="transition-colors hover:text-orange-400">FAQ</Link></li>
              <li><Link to="/contact" className="transition-colors hover:text-orange-400">Contact</Link></li>
            </ul>
          </div>

          {/* contact */}
          <div className="col-span-2 lg:col-span-1">
            <h4 className="font-display text-sm font-bold uppercase tracking-wide text-white">Get in Touch</h4>
            <a href="mailto:support@adviprints.com" className="mt-4 inline-flex items-center gap-2.5 text-sm transition-colors hover:text-orange-400">
              <Mail size={16} className="shrink-0 text-orange-500" />
              support@adviprints.com
            </a>
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div className="border-t border-navy-800">
        <div className="container-px mx-auto max-w-7xl py-6">
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-navy-500 sm:flex-row">
            <p>&copy; {new Date().getFullYear()} Adviprints. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
