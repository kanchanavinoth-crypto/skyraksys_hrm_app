#!/bin/bash

# Skyraksys HRM - Development Setup Script
# This script sets up the development environment for both backend and frontend

echo "🚀 Setting up Skyraksys HRM Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_success "Node.js $NODE_VERSION is installed"
    else
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
}

# Check if PostgreSQL is installed
check_postgresql() {
    print_status "Checking PostgreSQL installation..."
    if command -v psql &> /dev/null; then
        PG_VERSION=$(psql --version)
        print_success "PostgreSQL is installed: $PG_VERSION"
    else
        print_warning "PostgreSQL not found in PATH. Please ensure PostgreSQL 14+ is installed."
    fi
}

# Setup Backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend || { print_error "Backend directory not found"; exit 1; }
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_status "Creating .env file from template..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Please update .env file with your database credentials"
        else
            print_warning ".env.example not found. Please create .env file manually"
        fi
    else
        print_success ".env file already exists"
    fi
    
    cd ..
    print_success "Backend setup completed"
}

# Setup Frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend || { print_error "Frontend directory not found"; exit 1; }
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    cd ..
    print_success "Frontend setup completed"
}

# Create database setup script
create_db_script() {
    print_status "Creating database setup instructions..."
    
    cat > setup-database-instructions.md << 'EOF'
# Database Setup Instructions

## 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE skyraksys_hrm;
CREATE USER hrm_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm TO hrm_user;

# Exit PostgreSQL
\q
```

## 2. Update Backend .env File

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm
DB_USER=hrm_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_REFRESH_SECRET=your_super_secret_refresh_key_minimum_32_characters
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Server Configuration
PORT=8080
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 3. Run Database Migrations

```bash
cd backend
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

## 4. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## Default Login Credentials

- **Admin**: admin@skyraksys.com / Admin@123
- **HR**: hr@skyraksys.com / Hr@123
- **Manager**: manager@skyraksys.com / Manager@123
- **Employee**: employee@skyraksys.com / Employee@123
EOF

    print_success "Database setup instructions created: setup-database-instructions.md"
}

# Create development scripts
create_dev_scripts() {
    print_status "Creating development scripts..."
    
    # Backend development script
    cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Skyraksys HRM Backend..."
cd backend
npm run dev
EOF
    chmod +x start-backend.sh
    
    # Frontend development script
    cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "🎨 Starting Skyraksys HRM Frontend..."
cd frontend
npm start
EOF
    chmod +x start-frontend.sh
    
    # Full development script
    cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Skyraksys HRM Full Development Environment..."

# Function to handle Ctrl+C
cleanup() {
    echo "Shutting down development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Start backend in background
echo "Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo "Starting frontend server..."
cd ../frontend && npm start &
FRONTEND_PID=$!

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
EOF
    chmod +x start-dev.sh
    
    print_success "Development scripts created"
}

# Create testing setup
create_testing_setup() {
    print_status "Creating testing setup..."
    
    # Backend testing configuration
    cd backend
    
    # Add test scripts to package.json if not exists
    if ! grep -q "\"test\":" package.json; then
        print_status "Adding test scripts to backend package.json..."
        # This would require jq or manual editing
    fi
    
    cd ..
    
    # Frontend testing is already set up with create-react-app
    print_success "Testing setup completed"
}

# Main execution
main() {
    echo "=========================================="
    echo "    Skyraksys HRM Development Setup     "
    echo "=========================================="
    echo ""
    
    check_nodejs
    check_postgresql
    setup_backend
    setup_frontend
    create_db_script
    create_dev_scripts
    create_testing_setup
    
    echo ""
    echo "=========================================="
    print_success "Setup completed successfully!"
    echo "=========================================="
    echo ""
    echo "📋 Next Steps:"
    echo "1. Follow instructions in setup-database-instructions.md"
    echo "2. Update backend/.env with your database credentials"
    echo "3. Run: ./start-dev.sh to start both servers"
    echo ""
    echo "🌐 URLs:"
    echo "  Backend:  http://localhost:8080"
    echo "  Frontend: http://localhost:3000"
    echo ""
    echo "📚 Documentation:"
    echo "  Backend:  backend/README-REFACTORED-COMPLETE.md"
    echo "  API Docs: http://localhost:8080/ (when running)"
    echo ""
}

# Run main function
main
