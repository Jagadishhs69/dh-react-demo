module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Prohibit console statements in production code
    'no-console': 'error',
    'no-debugger': 'error',
    
    // Additional rules for better code quality
    'no-unused-vars': 'error',
    'no-undef': 'error',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  env: {
    browser: true,
    es6: true,
    node: true,
    jest: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
