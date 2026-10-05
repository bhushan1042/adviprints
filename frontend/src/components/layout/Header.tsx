import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, ChevronDown } from 'lucide-react';
import { useScrollPosition } from '@/hooks/useReveal';
import useCatalogCategories from '@/hooks/useCatalogCategories';
import BrandLogo from '@/components/ui/BrandLogo';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/category/all', hasDropdown: true },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'About', to: '/about' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Contact', to: '/contact' },
];

export default function Header() {
  const scrolled = useScrollPosition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopDropdown, setShopDropdown] = useState(false);
  const location = useLocation();
  const { categories, error: categoriesError } = useCatalogCategories();

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to.split('/')[1] === '' ? to : `/${to.split('/')[1]}`);

  return (
    <>
      {/* announcement bar */}
      <div className="bg-navy-900 text-white">
        <div className="container-px mx-auto flex max-w-7xl items-center justify-center py-2 text-center text-xs font-medium sm:text-sm">
          <span className="text-orange-300">Custom t-shirts </span>
          <span className="mx-1.5 text-navy-400">made your way</span>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 shadow-md backdrop-blur-md'
            : 'bg-white'
        }`}
      >
        <nav className="container-px mx-auto flex max-w-7xl items-center justify-between py-4">
          {/* logo */}
          <Link to="/" className="shrink-0 transition-transform duration-300 hover:scale-[1.02]" onClick={() => setMobileOpen(false)}>
            <BrandLogo size="md" className="max-w-[180px] sm:max-w-[205px]" />
          </Link>

          {/* desktop nav */}
          <ul className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <li
                key={link.to}
                className="relative"
                onMouseEnter={() => link.hasDropdown && setShopDropdown(true)}
                onMouseLeave={() => link.hasDropdown && setShopDropdown(false)}
              >
                <NavLink
                  to={link.to}
                  className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive(link.to)
                      ? 'text-orange-600'
                      : 'text-navy-700 hover:text-orange-600'
                  }`}
                >
                  {link.label}
                  {link.hasDropdown && <ChevronDown size={15} className="mt-0.5" />}
                </NavLink>

                {link.hasDropdown && shopDropdown && (
                  <div className="absolute left-0 top-full w-64 pt-2">
                    <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white p-2 shadow-xl shadow-navy-900/10">
                      <Link
                        to="/category/all"
                        className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:bg-orange-50 hover:text-orange-600"
                      >
                        All T-Shirts
                      </Link>
                      <div className="my-1 h-px bg-navy-100" />
                      {categories.map((cat) => (
                        <Link
                          key={cat.slug}
                          to={`/category/${cat.slug}`}
                          className="block rounded-lg px-4 py-2.5 text-sm text-navy-600 transition-colors hover:bg-orange-50 hover:text-orange-600"
                        >
                          {cat.name}
                        </Link>
                      ))}
                      {categoriesError && (
                        <p className="px-4 py-2 text-xs text-error-600">{categoriesError}</p>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* actions */}
          <div className="flex items-center gap-2">
            <Link
              to="/category/all"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-navy-600 transition-colors hover:bg-navy-50 hover:text-orange-600"
              aria-label="Shop products"
              title="Shop products"
            >
              <ShoppingBag size={20} />
            </Link>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl text-navy-700 lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>

        {/* mobile menu */}
        {mobileOpen && (
          <div className="border-t border-navy-100 bg-white lg:hidden">
            <div className="container-px mx-auto max-w-7xl py-4">
              <ul className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={`block rounded-lg px-4 py-3 text-base font-semibold transition-colors ${
                        isActive(link.to)
                          ? 'bg-orange-50 text-orange-600'
                          : 'text-navy-700 hover:bg-navy-50'
                      }`}
                    >
                      {link.label}
                    </Link>
                    {link.hasDropdown && (
                      <div className="ml-4 mb-2 flex flex-col gap-0.5 border-l border-navy-100 pl-3">
                        <Link
                          to="/category/all"
                          onClick={() => setMobileOpen(false)}
                          className="rounded-lg px-4 py-2 text-sm font-medium text-navy-600 hover:text-orange-600"
                        >
                          All T-Shirts
                        </Link>
                        {categories.map((cat) => (
                          <Link
                            key={cat.slug}
                            to={`/category/${cat.slug}`}
                            onClick={() => setMobileOpen(false)}
                            className="rounded-lg px-4 py-2 text-sm text-navy-600 hover:text-orange-600"
                          >
                            {cat.name}
                          </Link>
                        ))}
                        {categoriesError && (
                          <p className="px-4 py-2 text-xs text-error-600">{categoriesError}</p>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
