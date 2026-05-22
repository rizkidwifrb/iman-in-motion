import { cn } from '../../utils/cn';

const variants = {
  default: 'bg-iim-gold text-iim-charcoal shadow-glow hover:-translate-y-0.5 hover:shadow-xl',
  secondary: 'border border-white/10 bg-white/10 text-iim-cream hover:-translate-y-0.5 hover:bg-white/15',
  ghost: 'text-iim-coffee hover:bg-iim-gold/10 dark:text-iim-cream dark:hover:bg-white/10'
};

export function Button({ as: Comp = 'button', variant = 'default', className = '', children, ...props }) {
  return (
    <Comp
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition duration-300 focus-visible:outline focus-visible:outline-4 focus-visible:outline-iim-gold/30 disabled:pointer-events-none disabled:opacity-60',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
