import React, { useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, addDoc } from 'firebase/firestore';

const PostGameForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'games'), {
      title,
      description,
      date,
      location,
    });
    setTitle('');
    setDescription('');
    setDate('');
    setLocation('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Game Title" required />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" required />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" required />
      <button type="submit">Post Game</button>
    </form>
  );
};

export default PostGameForm;