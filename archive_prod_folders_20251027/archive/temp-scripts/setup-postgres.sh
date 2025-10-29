#!/bin/bash

# SkyrakSys HRM - Docker PostgreSQL Setup Script
# This script sets up PostgreSQL with Docker for local development and production

echo "🚀 SkyrakSys HRM - Setting up PostgreSQL with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Stop existing containers if running
echo "🛑 Stopping existing containers..."
docker-compose down

# Pull latest images
echo "📥 Pulling latest PostgreSQL image..."
docker-compose pull

# Start PostgreSQL with Docker Compose
echo "🐳 Starting PostgreSQL container..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check if PostgreSQL is responding
echo "🔍 Checking PostgreSQL connection..."
timeout 30s bash -c 'until docker exec skyraksys_hrm_postgres pg_isready -U hrm_user -d skyraksys_hrm; do sleep 1; done'

if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL is ready!"
    echo ""
    echo "📊 Database Information:"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo "  Database: skyraksys_hrm"
    echo "  Username: hrm_user"
    echo "  Password: hrm_password_2025"
    echo ""
    echo "🎯 Next steps:"
    echo "  1. Run database migrations: npm run migrate"
    echo "  2. Run database seeders: npm run seed"
    echo "  3. Start the application: npm start"
    echo ""
    echo "🔧 Optional: Start pgAdmin for database management:"
    echo "  docker-compose up -d pgadmin"
    echo "  Access at: http://localhost:8081"
    echo "  Email: admin@skyraksys.com"
    echo "  Password: admin123"
else
    echo "❌ PostgreSQL failed to start properly"
    echo "🔍 Checking logs..."
    docker-compose logs postgres
    exit 1
fi
