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
│   ├── migrations/        # Database migrations (Sequelize)
│   ├── seeders/           # Database seeders
│   ├── README.md          # Backend documentation
│   └── server.js          # Entry point
│
├── frontend/               # React frontend
│   ├── public/            # Static assets
│   ├── src/               # Source code
│   └── e2e/               # Playwright E2E tests
│       ├── README.md      # E2E testing guide
│       └── QUICK_START.md # Quick reference
│
├── redhatprod/            # 🎯 Production deployment (RHEL 9.6)
│   ├── START_HERE.md      # ⭐ Quick start
│   ├── PRODUCTION_DEPLOYMENT_GUIDE.md  # Complete guide
│   ├── MIGRATION_GUIDE.md # Database migrations
│   ├── scripts/           # Automated deployment scripts
│   └── templates/         # Configuration templates
│
├── docs/                  # 📚 Documentation
│   ├── README.md          # Documentation index
│   ├── api/               # API documentation
│   ├── deployment/        # Deployment guides
│   ├── development/       # Developer guides
│   ├── features/          # Feature documentation
│   └── production/        # Production checklists
│
├── admin-debug-panel/     # 🔧 Database debug tool (dev only)
├── tests/                 # Backend test suites
├── obsolete/              # 📦 Archived documentation
│   └── README.md          # Archive index
│
├── README.md              # ⭐ This file
├── CHANGELOG.md           # Version history
└── .github/
    └── copilot-instructions.md  # AI assistance config
```

## 📚 Documentation

### For Production Deployment
🎯 **Start Here:** [`redhatprod/START_HERE.md`](redhatprod/START_HERE.md)

**Essential Guides:**
- 📘 [Complete Deployment Guide](redhatprod/PRODUCTION_DEPLOYMENT_GUIDE.md)
- 📘 [Database Migrations](redhatprod/MIGRATION_GUIDE.md)
- 📘 [Manual Installation](redhatprod/MANUAL_INSTALLATION_GUIDE.md)

**Automated Scripts:** [`redhatprod/scripts/`](redhatprod/scripts/)

### For Development
📖 **Backend:** [`backend/README.md`](backend/README.md)  
📖 **Frontend E2E:** [`frontend/e2e/README.md`](frontend/e2e/README.md)  
📖 **Admin Panel:** [`admin-debug-panel/README.md`](admin-debug-panel/README.md)

### For Features & Guides
📚 **Documentation:** [`docs/README.md`](docs/README.md)

### Historical
📦 **Archived:** [`obsolete/README.md`](obsolete/README.md) - Completed fixes and superseded guides

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
