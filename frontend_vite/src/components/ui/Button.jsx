import { cn } from '../../lib/utils';

const variants = {
  primary: 'bg-brand text-white hover:bg-brand-dark active:scale-[0.98] shadow-[0_1px_1px_rgba(0,0,0,0.1)]',
  secondary: 'bg-white text-[#1d1d1f] border border-card-border hover:bg-[#F5F5F7] active:bg-[#E8E8ED]',
  danger: 'bg-accent-red text-white hover:bg-[#E0342C] active:scale-[0.98]',
  ghost: 'text-brand hover:bg-brand/8 active:bg-brand/12',
};

const sizes = {
  sm: 'px-3 py-1.5 text-[12px] rounded-lg',
  md: 'px-4 py-2 text-[14px] rounded-xl',
  lg: 'px-6 py-2.5 text-[15px] rounded-xl',
};

export default function Button({ children, variant = 'primary', size = 'md', className, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
