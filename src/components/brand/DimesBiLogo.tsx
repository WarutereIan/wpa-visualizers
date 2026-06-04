import { Link } from '@tanstack/react-router'
import { cn } from '#/lib/utils'

export const DIMES_BI_LOGO_SRC = '/dimes-bi.png'

type DimesBiLogoProps = {
  className?: string
  /** Render height — lockup scales proportionally */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** Crop to icon mark only (left ~38% of lockup) */
  variant?: 'lockup' | 'icon'
  linkToHome?: boolean
}

/** Lockup: fixed frame + scale so wordmark text stays legible in the PNG */
const lockupFrame: Record<
  Exclude<DimesBiLogoProps['size'], undefined>,
  { frame: string; scale: string }
> = {
  xs: { frame: 'h-10 w-[9rem]', scale: 'scale-[1.45]' },
  sm: { frame: 'h-11 w-[10rem]', scale: 'scale-[1.55]' },
  md: { frame: 'h-12 w-[11rem]', scale: 'scale-[1.65]' },
  lg: { frame: 'h-14 w-[12.5rem]', scale: 'scale-[1.75]' },
  xl: { frame: 'h-16 w-[14rem]', scale: 'scale-[1.85]' },
  '2xl': {
    frame: 'h-16 w-[15rem] sm:h-[4.5rem] sm:w-[17.5rem]',
    scale: 'scale-[1.9] sm:scale-[2.05]',
  },
}

const iconFrame: Record<Exclude<DimesBiLogoProps['size'], undefined>, { frame: string; scale: string }> = {
  xs: { frame: 'h-9 w-10', scale: 'scale-[1.5]' },
  sm: { frame: 'h-10 w-11', scale: 'scale-[1.55]' },
  md: { frame: 'h-11 w-12', scale: 'scale-[1.6]' },
  lg: { frame: 'h-12 w-[3.25rem]', scale: 'scale-[1.65]' },
  xl: { frame: 'h-12 w-[3.25rem]', scale: 'scale-[1.7]' },
  '2xl': { frame: 'h-12 w-[3.25rem]', scale: 'scale-[1.7]' },
}

export function DimesBiLogo({
  className,
  size = 'md',
  variant = 'lockup',
  linkToHome = true,
}: DimesBiLogoProps) {
  const lockup = lockupFrame[size]

  const image =
    variant === 'lockup' ? (
      <span
        className={cn(
          'relative inline-flex shrink-0 items-center justify-start overflow-hidden',
          lockup.frame,
          className,
        )}
      >
        <img
          src={DIMES_BI_LOGO_SRC}
          alt="DIMES-BI"
          className={cn(
            'absolute left-0 top-1/2 h-[96%] w-auto max-w-none -translate-y-1/2 object-contain object-left origin-left',
            lockup.scale,
          )}
          decoding="async"
        />
      </span>
    ) : (
      <span
        className={cn(
          'relative inline-flex shrink-0 items-center justify-start overflow-hidden',
          iconFrame[size].frame,
          className,
        )}
      >
        <img
          src={DIMES_BI_LOGO_SRC}
          alt="DIMES-BI"
          className={cn(
            'absolute left-0 top-1/2 h-[96%] w-auto max-w-none -translate-y-1/2 object-contain object-left origin-left',
            iconFrame[size].scale,
          )}
          decoding="async"
        />
      </span>
    )

  if (!linkToHome) {
    return <span className="inline-flex shrink-0 items-center">{image}</span>
  }

  return (
    <Link
      to="/"
      className="inline-flex shrink-0 items-center no-underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--lagoon)] focus-visible:ring-offset-2 rounded-md"
      aria-label="DIMES-BI home"
    >
      {image}
    </Link>
  )
}
