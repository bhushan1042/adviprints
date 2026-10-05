import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'white';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  to?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 active:scale-[0.97]',
  secondary:
    'bg-navy-800 text-white hover:bg-navy-900 shadow-lg shadow-navy-800/20 hover:shadow-navy-800/30 active:scale-[0.97]',
  outline:
    'border-2 border-navy-200 text-navy-800 hover:border-orange-400 hover:text-orange-600 bg-transparent active:scale-[0.97]',
  ghost:
    'text-navy-700 hover:bg-navy-50 hover:text-navy-900 active:scale-[0.97]',
  white:
    'bg-white text-navy-800 hover:bg-navy-50 shadow-lg shadow-black/10 active:scale-[0.97]',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-5 py-2.5 text-sm',
  md: 'px-7 py-3.5 text-base',
  lg: 'px-9 py-4 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  href,
  onClick,
  className = '',
  type = 'button',
  fullWidth = false,
}: ButtonProps) {
  const base = `inline-flex items-center justify-center gap-2 font-display font-semibold rounded-xl transition-all duration-300 ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`;

  if (to) {
    return (
      <Link to={to} className={base} onClick={onClick}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={base} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={base}>
      {children}
    </button>
  );
}
