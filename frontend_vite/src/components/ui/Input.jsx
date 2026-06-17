import { cn } from '../../lib/utils';

export default function Input({ className, label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[12px] font-medium text-secondary uppercase tracking-wide">{label}</label>}
      <input
        className={cn(
          'w-full px-3.5 py-2 rounded-xl border border-card-border bg-white text-[15px] text-[#1d1d1f]',
          'placeholder:text-[#86868B]',
          'focus:outline-none focus:ring-4 focus:ring-brand/12 focus:border-brand',
          'transition-all duration-200',
          className
        )}
        {...props}
      />
    </div>
  );
}

export function Select({ className, label, children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[12px] font-medium text-secondary uppercase tracking-wide">{label}</label>}
      <select
        className={cn(
          'w-full px-3.5 py-2 rounded-xl border border-card-border bg-white text-[15px] text-[#1d1d1f] appearance-none',
          'focus:outline-none focus:ring-4 focus:ring-brand/12 focus:border-brand',
          'transition-all duration-200',
          'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2386868B%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")] bg-[length:14px] bg-[position:right_12px_center] bg-no-repeat pr-10',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
