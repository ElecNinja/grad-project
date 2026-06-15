#!/bin/bash

# Start FastAPI AI service in the background on port 8000
echo "Starting AI service..."
cd AI
python -m uvicorn api:app --host 0.0.0.0 --port 8000 &
AI_PID=$!
cd ..

# Start Express backend in the foreground
echo "Starting Express backend..."
cd Backend-ExpressJS
node server.js
