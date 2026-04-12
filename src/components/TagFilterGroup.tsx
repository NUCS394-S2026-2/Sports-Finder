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
    <section className="tag-filter-group" aria-label={label}>
      <p className="tag-filter-label">{label}</p>
      <div className="tag-filter-row">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={option === value ? 'chip chip-active' : 'chip'}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}
