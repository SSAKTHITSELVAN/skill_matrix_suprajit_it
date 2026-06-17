import { cn } from '../../lib/utils';

export default function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-card-border/50 shadow-[0_0_0_0.5px_rgba(0,0,0,0.03),0_2px_4px_-1px_rgba(0,0,0,0.04),0_4px_8px_-2px_rgba(0,0,0,0.03)]',
        hover && 'card-hover cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return <div className={cn('px-6 py-4 border-b border-card-border/40', className)}>{children}</div>;
}

export function CardContent({ children, className }) {
  return <div className={cn('px-6 py-5', className)}>{children}</div>;
}
