import { useState } from 'react';
import { ChevronDown, MessageCircle, Mail } from 'lucide-react';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import { faqData } from '@/data/faq';

export default function FAQ() {
  const [openCategory, setOpenCategory] = useState(0);
  const [openQuestion, setOpenQuestion] = useState<string | null>('0-0');

  return (
    <div className="bg-white">
      {/* hero */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-1/4 top-0 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
        </div>
        <div className="container-px relative mx-auto max-w-7xl py-16 lg:py-24">
          <div className="max-w-2xl">
            <span className="mb-4 inline-block text-sm font-bold uppercase tracking-widest text-orange-400">
              Help Centre
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Frequently Asked
              <span className="block text-orange-500">Questions</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-navy-200">
              Everything you need to know about ordering, printing, shipping, and caring for your custom t-shirts.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ content */}
      <section className="container-px mx-auto max-w-4xl py-16 lg:py-20">
        {/* category tabs */}
        <div className="mb-10 flex flex-wrap gap-2">
          {faqData.map((cat, i) => (
            <button
              key={cat.category}
              onClick={() => setOpenCategory(i)}
              className={`rounded-xl px-5 py-2.5 font-display text-sm font-semibold transition-all ${
                openCategory === i
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-navy-50 text-navy-700 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              {cat.category}
            </button>
          ))}
        </div>

        {/* questions */}
        <div className="space-y-3">
          {faqData[openCategory].questions.map((item, i) => {
            const id = `${openCategory}-${i}`;
            const isOpen = openQuestion === id;
            return (
              <div
                key={id}
                className={`overflow-hidden rounded-2xl border transition-all ${
                  isOpen ? 'border-orange-200 bg-orange-50/30 shadow-sm' : 'border-navy-100 bg-white'
                }`}
              >
                <button
                  onClick={() => setOpenQuestion(isOpen ? null : id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                >
                  <span className="font-display text-base font-bold text-navy-900">{item.q}</span>
                  <ChevronDown
                    size={22}
                    className={`shrink-0 transition-all duration-300 ${
                      isOpen ? 'rotate-180 text-orange-500' : 'text-navy-400'
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 leading-relaxed text-navy-600">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* still have questions */}
        <div className="mt-16 rounded-3xl bg-navy-50 p-8 text-center lg:p-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/25">
            <MessageCircle size={26} className="text-white" />
          </div>
          <h3 className="font-display text-2xl font-bold text-navy-900">Still have questions?</h3>
          <p className="mx-auto mt-2 max-w-md text-navy-500">
            Contact us using the details listed on the Contact page.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button to="/contact" variant="primary" size="md">
              <Mail size={18} />
              Contact Support
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
