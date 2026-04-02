# Pickup Sports Finder

## Overview
Pickup Sports Finder is a web application designed to help users find and organize pickup sports games in their area. The app allows users to search for games based on various filters, post new games, and learn more about the community.

## Features
- **Home Page**: A welcoming hero section with a brief introduction and call-to-action buttons.
- **Find Games Page**: Users can filter games by sport, skill level, and gender. The page displays a list of available games with details.
- **Post Game Page**: A form for users to submit new games, including details such as sport, location, date/time, and capacity.
- **About Page**: Information about the app's purpose and features.

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/pickup-sports-finder.git
   ```
2. Navigate to the project directory:
   ```
   cd pickup-sports-finder
   ```
3. Install the dependencies:
   ```
   npm install
   ```

### Running the App
To start the development server, run:
```
npm start
```
The app will be available at `http://localhost:3000`.

### Firebase Configuration
Make sure to replace the placeholder values in `src/firebase/firebase.ts` with your actual Firebase project configuration.

## Project Structure
```
pickup-sports-finder
├── src
│   ├── App.tsx
│   ├── index.tsx
│   ├── firebase
│   │   └── firebase.ts
│   ├── components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── GameCard.tsx
│   │   ├── GameFilters.tsx
│   │   └── PostGameForm.tsx
│   ├── pages
│   │   ├── Home.tsx
│   │   ├── FindGames.tsx
│   │   ├── PostGame.tsx
│   │   └── About.tsx
│   ├── data
│   │   └── sampleGames.ts
│   ├── styles
│   │   └── globals.css
│   └── types
│       └── game.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.