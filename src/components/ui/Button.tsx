import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const base =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 text-center transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: `${base} rounded-full bg-gradient-to-br from-brand-500 to-brand-400 px-5 py-2.5 font-extrabold text-ink shadow-sm hover:-translate-y-px active:translate-y-0`,
  secondary: `${base} rounded-full border border-white/15 bg-white/5 px-5 py-2.5 font-semibold text-cream hover:-translate-y-px hover:bg-white/10 active:translate-y-0`,
  ghost: `${base} rounded-full border border-white/15 bg-white/5 px-4 py-2 font-semibold text-cream hover:-translate-y-px hover:bg-white/10 active:translate-y-0`,
};

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${variants[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
