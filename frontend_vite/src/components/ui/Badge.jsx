import { cn } from '../../lib/utils';

const variants = {
  default: 'bg-[#F5F5F7] text-[#1d1d1f]/70',
  brand: 'bg-brand/10 text-brand',
  success: 'bg-[#34C759]/10 text-[#248A3D]',
  warning: 'bg-[#FF9500]/10 text-[#C93400]',
  danger: 'bg-[#FF3B30]/10 text-[#D70015]',
  info: 'bg-[#007AFF]/10 text-[#0055D4]',
};

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold', variants[variant], className)}>
      {children}
    </span>
  );
}
