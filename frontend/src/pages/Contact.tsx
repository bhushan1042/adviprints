import { useState } from 'react';
import { Mail, Clock, Send } from 'lucide-react';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import { useReveal } from '@/hooks/useReveal';

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(form.subject || 'Adviprints enquiry');
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    );
    window.location.assign(`mailto:support@adviprints.com?subject=${subject}&body=${body}`);
  };

  return (
    <div className="bg-white">
      {/* hero */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 top-0 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-accent-500/15 blur-3xl" />
        </div>
        <div className="container-px relative mx-auto max-w-7xl py-16 lg:py-24">
          <div className="max-w-2xl">
            <span className="mb-4 inline-block text-sm font-bold uppercase tracking-widest text-orange-400">
              We Are Here to Help
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Get in
              <span className="block text-orange-500">Touch</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-navy-200">
              Questions about your order, custom designs, or bulk pricing? We would love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* contact info cards */}
      <section className="container-px mx-auto max-w-7xl py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {[
            { icon: Mail, title: 'Email Support', value: 'support@adviprints.com', desc: 'Order and customization enquiries' },
            { icon: Clock, title: 'Order Enquiries', value: 'Include your order ID', desc: 'This helps us identify your order.' },
          ].map((c, i) => (
            <ContactCard key={i} info={c} index={i} />
          ))}
        </div>
      </section>

      {/* form + map */}
      <section className="container-px mx-auto max-w-7xl pb-16 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* form */}
          <div className="rounded-3xl border border-navy-100 p-6 lg:p-8">
            <SectionHeading
              eyebrow="Send a Message"
              title="We'd Love to Hear From You"
            />

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Your Name" name="name" value={form.name} onChange={handleChange} required placeholder="Jane Doe" />
                  <Field label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="jane@email.com" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-navy-800">Subject</label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-navy-800 outline-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="">Select a topic...</option>
                    <option value="order">Order Enquiry</option>
                    <option value="custom">Custom Design Help</option>
                    <option value="bulk">Bulk / Team Orders</option>
                    <option value="returns">Returns & Refunds</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-navy-800">Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Tell us how we can help..."
                    className="w-full resize-none rounded-xl border border-navy-200 bg-white px-4 py-3 text-navy-800 outline-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <Button type="submit" size="lg" fullWidth>
                  <Send size={18} />
                  Open Email App
                </Button>
              <p className="text-xs text-navy-500">Your email app will open with this message; the website does not submit or store contact messages.</p>
            </form>
          </div>

          {/* map / visual */}
          <div className="flex flex-col gap-6">
            <div className="overflow-hidden rounded-3xl">
              <img
                src="https://images.pexels.com/photos/6322360/pexels-photo-6322360.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                alt="Adviprints studio"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="rounded-3xl bg-navy-900 p-6 text-white lg:p-8">
              <h3 className="font-display text-xl font-bold">Contact Support</h3>
              <p className="mt-2 text-sm text-navy-200">
For questions about products, customization, or an existing order, email our support team.
              </p>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="shrink-0 text-orange-400" />
                  <a href="mailto:support@adviprints.com" className="hover:text-orange-300">support@adviprints.com</a>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={18} className="shrink-0 text-orange-400" />
                  <span>Include your order ID for order-related requests.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactCard({ info, index }: { info: { icon: typeof Mail; title: string; value: string; desc: string }; index: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} rounded-2xl border border-navy-100 p-5 text-center transition-all hover:shadow-lg hover:shadow-navy-900/5`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
        <info.icon size={22} />
      </div>
      <h4 className="font-display text-sm font-bold text-navy-900">{info.title}</h4>
      <p className="mt-1 font-display text-sm font-semibold text-orange-600">{info.value}</p>
      <p className="mt-1 text-xs text-navy-500">{info.desc}</p>
    </div>
  );
}

function Field({
  label, name, value, onChange, required, placeholder, type = 'text',
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-navy-800">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-navy-800 outline-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />
    </div>
  );
}
