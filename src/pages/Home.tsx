import React from 'react';
import Hero from '../components/Hero';
import Footer from '../components/Footer';

const Home: React.FC = () => {
  return (
    <div>
      <Hero />
      <section className="homepage-content">
        <h2>Welcome to Pickup Sports Finder!</h2>
        <p>
          Discover local games, connect with players, and enjoy your favorite sports.
          Whether you're looking to join a game or organize one, we have you covered!
        </p>
      </section>
      <Footer />
    </div>
  );
};

export default Home;