import { cn } from './utils';

export function Section({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-10 md:py-12 lg:px-16',
        className,
      )}
      {...props}
    />
  );
}
