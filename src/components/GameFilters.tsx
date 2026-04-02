import React from 'react';

const GameFilters: React.FC = () => {
  return (
    <div className="game-filters">
      <h2>Filter Games</h2>
      <div className="filters">
        <select>
          <option value="">Select Sport</option>
          <option value="soccer">Soccer</option>
          <option value="basketball">Basketball</option>
          <option value="baseball">Baseball</option>
          <option value="tennis">Tennis</option>
        </select>
        <select>
          <option value="">Select Skill Level</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select>
          <option value="">Select Gender</option>
          <option value="any">Any</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        <button type="button">Apply Filters</button>
      </div>
    </div>
  );
};

export default GameFilters;