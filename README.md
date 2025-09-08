# React MUI Sample Project

A sample React application showcasing Material-UI (MUI) components and features.

## Features

This project demonstrates various MUI components including:

- **App Bar & Navigation** - Top navigation with branding
- **Cards & Layout** - Responsive grid layout with elevation
- **Forms & Inputs** - Text fields, switches, and ratings
- **Lists & Data Display** - Contact list with icons and avatars
- **Dialogs & Modals** - Interactive dialog components
- **Notifications** - Snackbar alerts and feedback
- **Theming** - Custom MUI theme configuration
- **Icons** - Material Design icons integration

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Navigate to the project directory:
   ```bash
   cd Wind_rules
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and visit `http://localhost:3000`

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
src/
├── components/
│   └── Dashboard.js     # Main dashboard component with MUI examples
├── App.js              # Main app component with theme provider
└── index.js            # Entry point
public/
├── index.html          # HTML template
package.json            # Dependencies and scripts
```

## MUI Components Used

- **Layout**: Container, Grid, Box, Paper
- **Navigation**: AppBar, Toolbar
- **Data Display**: Typography, Avatar, Chip, List, Rating
- **Inputs**: TextField, Switch, Button, Fab
- **Feedback**: Dialog, Snackbar, Alert, LinearProgress
- **Surfaces**: Card, Paper with elevation

## Code Quality

This project follows strict code quality rules:
- ESLint configuration with `no-console` and `no-debugger` rules
- Proper error handling and logging practices
- Clean component structure and organization

## Customization

The MUI theme can be customized in `src/App.js`. Current theme includes:
- Primary color: `#1976d2` (blue)
- Secondary color: `#dc004e` (pink)

## Learn More

- [Material-UI Documentation](https://mui.com/)
- [React Documentation](https://reactjs.org/)
- [Create React App Documentation](https://create-react-app.dev/)
