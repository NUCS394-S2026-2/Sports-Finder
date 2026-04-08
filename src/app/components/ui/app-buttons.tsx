import { cn } from './utils';

export function PrimaryButton({
  className,
  type = 'button',
  ...props
}: React.ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={cn(
        'rounded-[10px] bg-brand px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export function GhostButton({
  className,
  variant = 'brand',
  type = 'button',
  ...props
}: React.ComponentProps<'button'> & {
  variant?: 'brand' | 'on-dark';
}) {
  return (
    <button
      type={type}
      className={cn(
        'rounded-[10px] border px-5 py-3 font-semibold transition-colors',
        variant === 'brand' && 'border-brand text-brand hover:bg-brand-light',
        variant === 'on-dark' && 'border-white/80 text-white hover:bg-white/10',
        className,
      )}
      {...props}
    />
  );
}
