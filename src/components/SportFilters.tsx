import type { SportFilter } from '../types';

type SportFiltersProps = {
  activeSport: SportFilter;
  sports: SportFilter[];
  onSelectSport: (sport: SportFilter) => void;
};

export function SportFilters({ activeSport, sports, onSelectSport }: SportFiltersProps) {
  return (
    <div className="filter-row" aria-label="Filter pickup games by sport">
      {sports.map((sport) => (
        <button
          key={sport}
          type="button"
          className={sport === activeSport ? 'chip chip-active' : 'chip'}
          onClick={() => onSelectSport(sport)}
        >
          {sport}
        </button>
      ))}
    </div>
  );
}
