type TagFilterGroupProps<T extends string> = {
  label: string;
  value: T | 'All';
  options: Array<T | 'All'>;
  onChange: (value: T | 'All') => void;
};

export function TagFilterGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: TagFilterGroupProps<T>) {
  return (
    <section className="space-y-2" aria-label={label}>
      <p className="text-xs font-semibold uppercase tracking-wider text-cream-muted">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              option === value
                ? 'border-transparent bg-gradient-to-br from-brand-500 to-brand-400 text-ink'
                : 'border-white/15 bg-white/5 text-cream hover:border-white/25 hover:bg-white/10'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}
