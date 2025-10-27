# SkyrakSys HRM - Production Ready

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- PostgreSQL 13+
- npm or yarn

### Installation
```bash
# Clone repository
git clone <your-repo-url>
cd skyraksys_hrm

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### Environment Setup
```bash
# Copy environment template
cp .env.production.template .env.production

# Configure your environment variables:
# - Database connection
# - JWT secrets
# - API keys
```

### Database Setup
```bash
# Run database migrations
cd backend
npm run migrate

# Seed initial data
npm run seed
```

### Running the Application

#### Development
```bash
# Start backend (from root)
npm run start:backend

# Start frontend (from root) 
npm run start:frontend
```

#### Production
```bash
# Build frontend
cd frontend
npm run build

# Start with PM2
cd ..
pm2 start ecosystem.config.js
```

## 📁 Project Structure

```
skyraksys_hrm/
├── backend/                 # Express.js backend
│   ├── config/             # Database & app configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Authentication & validation
│   ├── models/            # Sequelize models
│   ├── routes/            # API routes
│   └── server.js          # Entry point
├── frontend/               # React frontend
│   ├── public/            # Static assets
│   ├── src/               # Source code
│   └── build/             # Production build
├── scripts/               # Utility scripts
│   ├── development/       # Development utilities
│   ├── database/         # Database scripts
│   ├── testing/          # Test scripts
│   └── deployment/       # Deployment scripts
├── docs/                 # Documentation
├── archive/              # Archived files
└── uploads/              # File uploads
```

## 🔧 Available Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database

### Frontend  
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 🚀 Deployment

See `docs/deployment/` for detailed deployment guides:
- Docker deployment
- Cloud deployment (AWS, Azure, GCP)
- CI/CD setup

## 📚 Documentation

- `docs/api/` - API documentation
- `docs/development/` - Development guides
- `docs/deployment/` - Deployment guides

## 🧪 Testing

Run development tests:
```bash
node scripts/testing/quick-api-test.js
```

## 🔒 Security

- JWT authentication
- Role-based access control
- Input validation
- SQL injection protection
- XSS protection

## 📄 License

[Your License Here]
