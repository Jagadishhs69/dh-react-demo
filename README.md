# React MUI Sample Project

A sample React application showcasing Material-UI (MUI) components and features.

## Features

This project demonstrates various MUI components including:


### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Jagadishhs69/dh-react-demo.git
cd dh-react-demo
git checkout dh-react-demo
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open in your browser at `http://localhost:3000`.

## 🛡️ Code Quality System

### Basic Quality Gates (Always Active)
- **ESLint validation** - Enforces code style and catches errors
- **Prettier formatting** - Ensures consistent code formatting
- **Pre-commit hooks** - Validates code before commits

### Enhanced Quality Gates (Optional - Local Setup)

For comprehensive code quality validation, developers can optionally install the Windsurf CI/CD pipeline locally:

#### Pipeline Features:
- 🔍 **Language Detection** - Identifies project technologies
- 📦 **Dependency Analysis** - Checks for security vulnerabilities
- 🔍 **Code Quality Metrics** - Advanced static analysis
- 📦 **Version Scanning** - Identifies outdated packages
- 🔐 **Secret Detection** - Prevents credential leaks
- 🛡️ **Security Analysis** - SAST security scanning

#### Local Pipeline Setup:
```bash
# Contact your team lead for pipeline installation package
# Pipeline runs automatically on commits when installed locally
# Generates detailed code review reports
```

## 📋 Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run lint` - Runs ESLint to check for code issues
- `npm run lint:fix` - Runs ESLint and fixes auto-fixable issues

## 🔄 Development Workflow

### Standard Workflow (All Developers)
```bash
# Make changes to code
git add .
git commit -m "Your commit message"
# → ESLint validation runs automatically
# → Commit succeeds if code passes basic checks
```

### Enhanced Workflow (With Local Pipeline)
```bash
# Make changes to code
git add .
git commit -m "Your commit message"
# → ESLint validation runs
# → Full 6-stage pipeline runs
# → Comprehensive quality report generated
# → Commit blocked if quality issues found
```

## 🎯 Quality Standards

- ✅ No console.log statements in production code
- ✅ Consistent code formatting (Prettier)
- ✅ React best practices compliance
- ✅ ESLint rule adherence
- ✅ Security vulnerability checks (with pipeline)
- ✅ Code complexity analysis (with pipeline)

## 🤝 Contributing

1. Follow the established code style
2. Ensure all pre-commit checks pass
3. Write meaningful commit messages
4. Test your changes locally before committing

## 📊 Features

- Material-UI components for modern UI design
- Responsive layout with Container and Grid system
- Integrated code quality validation
- Pre-commit hooks for automated checking
- Optional enhanced quality pipeline for comprehensive analysis

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
