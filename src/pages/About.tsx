import React from 'react';

const About: React.FC = () => {
  return (
    <div className="about-container">
      <h1>About Pickup Sports Finder</h1>
      <p>
        Pickup Sports Finder is an application designed to connect sports enthusiasts
        with local games and activities. Whether you're looking to join a game or
        organize one, our platform makes it easy to find and participate in pickup sports.
      </p>
      <h2>Our Mission</h2>
      <p>
        Our mission is to create a community where people can easily find and join
        sports games in their area, promoting an active lifestyle and social interaction.
      </p>
      <h2>Features</h2>
      <ul>
        <li>Find games based on your preferred sport and location.</li>
        <li>Post new games for others to join.</li>
        <li>Filter games by skill level, age range, and gender.</li>
        <li>Connect with other players and organizers.</li>
      </ul>
      <h2>Get Involved</h2>
      <p>
        Join us in making sports accessible and fun for everyone! Whether you're a seasoned player
        or just starting out, there's a place for you in our community.
      </p>
    </div>
  );
};

export default About;