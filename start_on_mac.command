#!/bin/bash

# Navigate to the directory where this script is located
cd "$(dirname "$0")"

echo "------------------------------------------------"
echo "🚀 GEOCONTROL PRO - MAC AUTO-START"
echo "------------------------------------------------"

# 1. Check for Node.js
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is NOT installed."
    echo "Please download it from: https://nodejs.org/"
    echo "Then run this file again."
    read -p "Press Enter to exit..."
    exit
fi

echo "✅ Node.js detected: $(node -v)"

# 2. Check for node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installing project requirements (this may take a minute)..."
    npm install
else
    echo "✅ Requirements already installed."
fi

echo "🔥 Starting Local Host..."
echo "------------------------------------------------"
echo "Please wait for the link (usually http://localhost:5173)"
echo "------------------------------------------------"

# 3. Run the development server
npm run dev
