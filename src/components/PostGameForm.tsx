import React, { useState } from 'react';

const PostGameForm: React.FC = () => {
  const [sport, setSport] = useState('');
  const [location, setLocation] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [capacity, setCapacity] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [gender, setGender] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log({
      sport,
      location,
      dateTime,
      capacity,
      organizer,
      skillLevel,
      ageRange,
      gender,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="post-game-form">
      <h2>Post a Game</h2>
      <label>
        Sport:
        <input type="text" value={sport} onChange={(e) => setSport(e.target.value)} required />
      </label>
      <label>
        Location:
        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
      </label>
      <label>
        Date/Time:
        <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} required />
      </label>
      <label>
        Capacity:
        <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
      </label>
      <label>
        Organizer Name:
        <input type="text" value={organizer} onChange={(e) => setOrganizer(e.target.value)} required />
      </label>
      <label>
        Skill Level:
        <select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} required>
          <option value="">Select</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </label>
      <label>
        Age Range:
        <input type="text" value={ageRange} onChange={(e) => setAgeRange(e.target.value)} required />
      </label>
      <label>
        Gender:
        <select value={gender} onChange={(e) => setGender(e.target.value)} required>
          <option value="">Select</option>
          <option value="Any">Any</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </label>
      <label>
        Notes:
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <button type="submit">Post Game</button>
    </form>
  );
};

export default PostGameForm;