import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import FindGames from './pages/FindGames';
import PostGame from './pages/PostGame';
import About from './pages/About';
import './styles/globals.css';

const App = () => {
  return (
    <Router>
      <div>
        <Navbar />
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/find-games" component={FindGames} />
          <Route path="/post-game" component={PostGame} />
          <Route path="/about" component={About} />
        </Switch>
        <Footer />
      </div>
    </Router>
  );
};

export default App;