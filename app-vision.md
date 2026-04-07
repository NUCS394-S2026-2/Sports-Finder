# App Vision: Pickup Sports Finder

## Core Idea
A web app that helps people find and join pickup sports games happening near them.

## Minimum Viable Features
- Browse a list of nearby pickup games (sport, location, time, players needed)
- Create a new pickup game listing
- Join an existing game

## User Interface
- Clean, mobile-friendly layout
- Home page shows a feed of available games
- Each game card shows: sport type, location, date/time, and spots remaining, and a join game spot if available
- A button to create a new game opens a simple form

## Game creation
- A user must be signed in to create a game
- If a user has already created a game, do not let them create another
- When creating a game, have user input the sport and location.
- Then, display the available times for that location
- User selects start and end times in 15 minute intervals(6:00, 6:15, 6:30, etc.)
- If another game for that sport is happening at the same time and place, do not make a new game and instead present the other game with an option to join.
- If there are no other games present the warning to users before allowing them to confirm the creation of the game
- Have them input details such as skill-level, age range, gender, requirements, and description.
- Once created, the game will be listed for people to join
- Host can then check the status of their game, seeing the names and emails of anyone wo signs up
- If a game becomes full, no longer list it, but allow the host to view it

## Warning
- "We are unable to guarentee the availability of the play area. Creaters of a game are responsible for ensuring that the location is usable at the time of the game."
- Two options: "Nevermind" and "I Understand"

## Joining a game
- User can search through the list of games using filters or the search bar
- Filters: location, time, sport, number of people who have already accepted
- Users see listings showing time, location, sport, and skill level
- User clicks on a listing that they want to join
- Listing popup shows a description and requirements provided by the creator
- User can back out by selecting an X or accept by selecting "Join"
- If logged in, the user is automatically joined, otherwise they must input their name and email
- Once registered, User is presented with a screen that displays the time, location, names of the people who are playing, and the host's email

## login
- Require a name and an email(no password for prototype)

## Sports Supported
- Soccer, Frisbee, Tennis (user can specify)

## Locations
- Hutchson Field - Soccer and Frisbee - Available 6:00-10:00pm mon-fri, 8:00am-9:00pm sat-sun
- Deering Meadow - Frisbee - Available anytime
- Northwestern Tennis Courts - Tennis - Available anytimes

## Data
- Games can be stored in memory (no database needed for prototype)

## Tech
- React + TypeScript
- No backend required for prototype