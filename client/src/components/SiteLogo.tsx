/**
 * SiteLogo — shared logo component used across all pages
 * Always links to the home page (/)
 */

import { Link } from 'wouter';
import { cn } from '@/lib/utils';

const LOGO_URL =
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663298408851/YygnMjeghyFLcTLEuY2iNZ/promptfit-logo-v2-hGDfCkwKFgzdUa7FbN4xWe.webp';

interface SiteLogoProps {
  /** Size of the logo icon in pixels. Defaults to 32. */
  size?: number;
  /** Whether to show the wordmark ("PromptFit") next to the icon. Defaults to true. */
  showWordmark?: boolean;
  /** Additional class names for the outer link element. */
  className?: string;
}

export default function SiteLogo({ size = 32, showWordmark = true, className }: SiteLogoProps) {
  return (
    <Link href="/">
      <a
        className={cn(
          'flex items-center gap-2 hover:opacity-80 transition-opacity select-none',
          className,
        )}
        aria-label="PromptFit — go to home"
      >
        <img
          src={LOGO_URL}
          alt="PromptFit"
          width={size}
          height={size}
          className="rounded-xl object-cover flex-shrink-0"
          style={{ width: size, height: size }}
        />
        {showWordmark && (
          <span className="text-[17px] font-bold text-[#1D1D1F] leading-none tracking-tight">
            PromptFit
          </span>
        )}
      </a>
    </Link>
  );
}
