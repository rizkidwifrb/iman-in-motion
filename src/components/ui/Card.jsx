import { cn } from '../../utils/cn';

export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-[1.75rem] border border-white/50 bg-white/70 shadow-premium backdrop-blur-xl transition duration-300 dark:border-white/10 dark:bg-white/[0.07]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ className = '', children, ...props }) {
  return <div className={cn('p-5 md:p-6', className)} {...props}>{children}</div>;
}
