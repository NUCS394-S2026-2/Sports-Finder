import React from 'react';

const Hero: React.FC = () => {
  return (
    <div className="hero">
      <h1 className="hero-title">Find Your Game Today!</h1>
      <p className="hero-subtitle">Join a community of sports enthusiasts and play your favorite games.</p>
      <div className="hero-buttons">
        <button className="btn btn-primary">Find Games</button>
        <button className="btn btn-secondary">Post a Game</button>
      </div>
    </div>
  );
};

export default Hero;