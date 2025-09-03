#!/bin/bash

# Create sessions directory if it doesn't exist
mkdir -p sessions
mkdir -p uploads

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Starting WhatsApp Baileys Server..."
echo "Server will run on port 3001"
echo "Make sure frontend is running on port 5173"
echo "=========================="

# Start the server
npm run dev