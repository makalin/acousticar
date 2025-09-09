#!/bin/bash

# AcoustiCar Setup Script
# This script sets up the development environment for AcoustiCar

set -e

echo "🚗 Setting up AcoustiCar - AI-Powered Car Audio Optimization"
echo "=============================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/data
mkdir -p backend/uploads
mkdir -p backend/models
mkdir -p backend/logs
mkdir -p frontend/build
mkdir -p nginx/ssl
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources

# Set permissions
echo "🔐 Setting permissions..."
chmod +x scripts/*.sh
chmod 755 backend/data
chmod 755 backend/uploads
chmod 755 backend/models
chmod 755 backend/logs

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update the .env file with your configuration before running the application."
fi

# Build Docker images
echo "🐳 Building Docker images..."
docker-compose build

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Test API endpoint
echo "🧪 Testing API endpoint..."
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend API is running on http://localhost:8000"
else
    echo "❌ Backend API is not responding"
fi

# Test frontend
echo "🧪 Testing frontend..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is running on http://localhost:3000"
else
    echo "❌ Frontend is not responding"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📱 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Documentation: http://localhost:8000/docs"
echo ""
echo "🔧 Useful commands:"
echo "   Start services: docker-compose up -d"
echo "   Stop services: docker-compose down"
echo "   View logs: docker-compose logs -f"
echo "   Restart services: docker-compose restart"
echo ""
echo "📊 Optional monitoring (with profile):"
echo "   Start with monitoring: docker-compose --profile monitoring up -d"
echo "   Prometheus: http://localhost:9090"
echo "   Grafana: http://localhost:3001 (admin/admin)"
echo ""
echo "Happy audio optimizing! 🎵"
