import { cn } from './utils';

export function AppCard({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white p-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]',
        className,
      )}
      {...props}
    />
  );
}
