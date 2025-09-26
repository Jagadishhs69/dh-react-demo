#!/bin/bash

# Windsurf Local CI/CD Pipeline Startup Script for Linux/Mac
# This script starts the local file watcher that monitors /src directory

set -e

echo ""
echo "🚀 Starting Windsurf Local CI/CD Pipeline..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ package.json not found"
    echo "Please run this script from the local-pipeline directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [[ ! -d "node_modules" ]]; then
    echo "📦 Installing dependencies..."
    npm install
    if [[ $? -ne 0 ]]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Create src directory if it doesn't exist
if [[ ! -d "../src" ]]; then
    echo "📁 Creating src directory..."
    mkdir -p "../src"
    cat > "../src/sample.js" << 'EOF'
// Sample file to trigger pipeline
console.log('Hello Windsurf CI/CD!');

function greet(name) {
    return `Hello, ${name}!`;
}

module.exports = { greet };
EOF
    echo "✅ Created sample file: ../src/sample.js"
fi

echo "✅ Setup complete!"
echo ""
echo "👀 Monitoring directory: $(pwd)/../src"
echo "🔄 Pipeline will run automatically when files change"
echo "🛑 Press Ctrl+C to stop"
echo ""

# Start the file watcher
node file-watcher.js
