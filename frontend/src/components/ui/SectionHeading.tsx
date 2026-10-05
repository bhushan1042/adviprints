import { useReveal } from '@/hooks/useReveal';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  className?: string;
}

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
  className = '',
}: SectionHeadingProps) {
  const { ref, visible } = useReveal();

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${center ? 'mx-auto text-center' : ''} ${className}`}
      style={{ maxWidth: center ? 640 : undefined }}
    >
      {eyebrow && (
        <span className="mb-3 inline-block text-sm font-bold uppercase tracking-widest text-orange-500">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl font-bold leading-tight text-navy-900 sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg leading-relaxed text-navy-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}
