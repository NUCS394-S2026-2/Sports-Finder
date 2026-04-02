import React from 'react';
import PostGameForm from '../components/PostGameForm';

const PostGame: React.FC = () => {
  return (
    <div className="post-game-container">
      <h1>Post a Game</h1>
      <PostGameForm />
    </div>
  );
};

export default PostGame;