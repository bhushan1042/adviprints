import { useEffect, useState } from 'react';
import { fetchBranding, getCachedBranding } from '@/utils/branding';
import { resolveImageUrl } from '@/utils/images';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
  className?: string;
}

const sizes = {
  sm: 'h-8 w-auto',
  md: 'h-10 w-auto',
  lg: 'h-14 w-auto',
};

export default function BrandLogo({ size = 'md', inverted = false, className = '' }: BrandLogoProps) {
  const [branding, setBranding] = useState(getCachedBranding);

  useEffect(() => {
    const controller = new AbortController();
    fetchBranding({ signal: controller.signal })
      .then((value) => setBranding(value || {}))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const logoPath = inverted
    ? branding.lightLogo || branding.footerLogo || branding.mainLogo
    : branding.mainLogo || branding.mobileLogo;

  return (
    <img
      src={logoPath ? resolveImageUrl(logoPath, '') : '/logo_transparent.png'}
      alt="Adviprints — Print Your Ideas. Wear Your Style."
      className={`${sizes[size]} object-contain ${inverted ? 'rounded-lg bg-white px-2 py-1' : ''} ${className}`}
    />
  );
}
