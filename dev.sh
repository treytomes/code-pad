#!/bin/bash
# Development startup script

set -e

echo "🚀 CodePad Development Environment"
echo "=================================="

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Python virtual environment not found!"
    echo "   Run: python3.11 -m venv venv"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    export PYTHON="$(pwd)/venv/bin/python"
    npm install
fi

# Check Node version
echo "📌 Using Node: $(node --version)"

# Check Python version
echo "🐍 Using Python: $(venv/bin/python --version)"

# Check .NET
if command -v dotnet &> /dev/null; then
    echo "⚙️  .NET SDK: $(dotnet --version)"
    if command -v dotnet-script &> /dev/null; then
        echo "✅ dotnet-script: $(dotnet script --version)"
    else
        echo "⚠️  dotnet-script not installed. Run: dotnet tool install -g dotnet-script"
    fi
else
    echo "❌ .NET SDK not found! Install from: https://dotnet.microsoft.com/download"
fi

echo ""
echo "Choose an option:"
echo "1) Start Vite dev server (renderer only)"
echo "2) Start Electron app (full app)"
echo "3) Run tests"
echo "4) Run linter"
echo "5) Build project"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo "🔥 Starting Vite dev server..."
        npm run dev
        ;;
    2)
        echo "⚡ Starting Electron app..."
        npm run electron:dev
        ;;
    3)
        echo "🧪 Running tests..."
        npm run test
        ;;
    4)
        echo "🔍 Running linter..."
        npm run lint
        ;;
    5)
        echo "🏗️  Building project..."
        npm run build
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
