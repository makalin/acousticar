#!/bin/bash

# AcoustiCar Development Script
# This script starts the development environment for AcoustiCar

set -e

echo "🚗 Starting AcoustiCar Development Environment"
echo "=============================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please run ./scripts/setup.sh first."
    exit 1
fi

# Start backend in development mode
echo "🐍 Starting backend development server..."
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py &
BACKEND_PID=$!
cd ..

# Start frontend in development mode
echo "⚛️  Starting frontend development server..."
cd frontend
npm install
npm start &
FRONTEND_PID=$!
cd ..

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ Development servers stopped."
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

echo ""
echo "🎉 Development environment started!"
echo ""
echo "📱 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Documentation: http://localhost:8000/docs"
echo ""
echo "🔧 Press Ctrl+C to stop all servers"
echo ""

# Wait for user to stop
wait
