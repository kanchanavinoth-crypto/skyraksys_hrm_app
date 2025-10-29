# 🚀 SkyRakSys HRM - Quick Start Guide

## 📋 Overview

You now have a **complete, production-ready HRM system** with:
- ✅ **Full-featured backend** (Node.js/Express/PostgreSQL)
- ✅ **Modern frontend** (React/Material-UI)  
- ✅ **Complete authentication** (JWT with role-based access)
- ✅ **All HRM modules** (Employee, Leave, Timesheet, Payroll)

## 🏁 Quick Start (5 Minutes)

### Prerequisites
- [x] Node.js 14+ installed
- [x] PostgreSQL installed and running
- [x] Git (optional)

### 1. Backend Setup

```bash
# Navigate to project root
cd d:\skyraksys_hrm

# Setup database and backend
setup-database.bat

# Start backend server
cd backend
npm run dev
```

**Backend will be running at:** `http://localhost:8080`

### 2. Frontend Setup

```bash
# In a new terminal, navigate to frontend
cd d:\skyraksys_hrm\frontend

# Start frontend development server
npm start
```

# 🚀 SkyRakSys HRM - Quick Start Guide

## 📋 Overview

You now have a **complete, production-ready HRM system** with:
- ✅ **Full-featured backend** (Node.js/Express/PostgreSQL)
- ✅ **Modern frontend** (React/Material-UI)  
- ✅ **Complete authentication** (JWT with role-based access)
- ✅ **All HRM modules** (Employee, Leave, Timesheet, Payroll)

## 🏁 Quick Start (5 Minutes)

### Prerequisites
- [x] Node.js 14+ installed
- [x] PostgreSQL installed and running
- [x] Git (optional)

### 1. Backend Setup

```bash
# Navigate to project root
cd d:\skyraksys_hrm

# Setup database and backend
setup-database.bat

# Start backend server
cd backend
npm run dev
```

**Backend will be running at:** `http://localhost:8080`

### 2. Frontend Setup

```bash
# In a new terminal, navigate to frontend
cd d:\skyraksys_hrm\frontend

# Start frontend development server
npm start
```

**Frontend will be running at:** `http://localhost:3000`

## 🔑 Login Credentials

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Admin** | admin@skyraksys.com | admin123 | Full system access |
| **HR** | hr@skyraksys.com | admin123 | HR management |
| **Manager** | lead@skyraksys.com | admin123 | Team management |
| **Employee** | employee1@skyraksys.com | admin123 | Employee access |

## 🎯 What's Included

### Backend Features ✅
- **Complete REST API** with 30+ endpoints
- **Authentication & Authorization** (JWT with roles)
- **Employee Management** (CRUD, departments, positions)
- **Leave Management** (requests, approvals, balances)
- **Timesheet Management** (time tracking, approvals)
- **Payroll Management** (salary processing, payslips)
- **Database Models** (13 comprehensive models)
- **Security** (bcrypt, helmet, rate limiting)
- **Validation** (Joi input validation)
- **Sample Data** (5 users, departments, projects)

### Frontend Features ✅
- **Modern React 18** with Material-UI 5
- **Authentication Context** with role-based access
- **Employee Management** components
- **Leave Management** system
- **Timesheet Entry** and approval
- **Dashboard** with analytics
- **Responsive Design** with modern themes

## 📁 Project Structure

```
skyraksys_hrm/
├── backend/                    # Node.js/Express API
│   ├── config/                # Database & app configuration
│   ├── models/                # Sequelize database models (13 models)
│   ├── routes/                # API routes (auth, employee, leave, timesheet, payroll)
│   ├── middleware/            # Authentication & validation middleware
│   ├── seeders/               # Database sample data
│   ├── server.js              # Express server entry point
│   ├── package.json           # Backend dependencies
│   └── README.md              # Backend documentation
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API service layer
│   │   ├── contexts/          # React contexts (auth, app)
│   │   └── utils/             # Helper utilities
│   └── package.json           # Frontend dependencies
├── setup-database.bat         # Automated database setup
└── QUICKSTART.md              # This file
```

## 🛠️ Available Scripts

### Backend Commands
```bash
cd backend

# Development with auto-reload
npm run dev

# Production mode
npm start

# Database operations
npm run db:migrate     # Run migrations
npm run db:seed        # Seed sample data
npm run db:reset       # Reset database

# Testing
npm test
```

### Frontend Commands  
```bash
cd frontend

# Development server
npm start

# Production build
npm run build

# Run tests
npm test
```

## 🔗 API Endpoints

**Base URL:** `http://localhost:8080/api`

| Module | Endpoints | Description |
|--------|-----------|-------------|
| **Auth** | `/auth/*` | Login, register, profile, password change |
| **Employees** | `/employees/*` | Employee CRUD, departments, positions |
| **Leaves** | `/leaves/*` | Leave requests, approvals, balances |
| **Timesheets** | `/timesheets/*` | Time tracking, approvals, projects |
| **Payroll** | `/payroll/*` | Payroll generation, payslips |

**Full API Documentation:** `backend/API_DOCUMENTATION.md`

## 🔍 Health Checks

### Backend Health Check
```bash
curl http://localhost:8080/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "HRM API Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Database Connection Check
```bash
cd backend
npm run db:migrate
```

Should complete without errors.

## 🎨 Frontend Integration

Your frontend is **already configured** to work with the backend:

- **API Services** point to `http://localhost:8080/api`
- **Authentication** expects JWT tokens
- **Role-based routing** matches backend permissions
- **Data models** align with backend responses

## 🔧 Configuration

### Backend Environment (`.env`)
```env
NODE_ENV=development
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm_dev
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your-secret-key
```

### Frontend Configuration (`src/http-common.js`)
```javascript
const API_BASE_URL = "http://localhost:8080/api";
```

## 🚀 Deployment Ready

Your system is **production-ready** with:

- ✅ **Security**: JWT auth, bcrypt passwords, input validation
- ✅ **Performance**: Database indexing, query optimization
- ✅ **Scalability**: Modular architecture, clean separation
- ✅ **Maintainability**: Well-documented, organized codebase

## 📞 Support

### Common Issues

**Backend won't start:**
1. Check PostgreSQL is running
2. Verify database credentials in `.env`
3. Run `npm install` in backend directory

**Frontend API errors:**
1. Ensure backend is running on port 8080
2. Check CORS configuration
3. Verify JWT tokens in browser storage

**Database errors:**
1. Run `setup-database.bat` again
2. Check PostgreSQL service is running
3. Verify database user permissions

### Documentation
- **Backend README:** `backend/README.md`
- **API Documentation:** `backend/API_DOCUMENTATION.md`  
- **Requirements:** `req.md`

## 🎉 You're All Set!

Your HRM system is **ready for development and production use**!

### Next Steps:
1. **Customize** the UI to match your branding
2. **Add features** specific to your organization
3. **Configure** email notifications
4. **Set up** automated backups
5. **Deploy** to your production environment

**Happy coding! 🚀**
- URL: `/dashboard`
- Overview of system statistics
- Quick action buttons
- Recent activities timeline

### Employee Management
- **View All**: `/employees`
- **Add New**: `/add-employee`
- **Edit**: `/employees/:id`

### Leave Management
- **Request Leave**: `/add-leave-request`
- **View Requests**: `/leave-requests`
- **Leave Balances**: `/leave-balances`

### Time & Payroll
- **Timesheet**: `/add-timesheet`
- **Payslips**: `/payslips`

## 🎨 UI Features

### Modern Design Elements
- Professional blue theme
- Responsive navigation
- Statistics cards
- Interactive buttons
- Font Awesome icons
- Smooth animations

### Navigation Structure
- **Dashboard** - Main overview
- **Employee Management** - Dropdown menu
  - View All Employees
  - Add New Employee
- **Leave Management** - Dropdown menu
  - Request Leave
  - Leave Requests
  - Leave Balances
- **Timesheet** - Direct link
- **Payroll** - Direct link

## 📱 Mobile Responsive

The application automatically adapts to:
- Mobile phones (< 768px)
- Tablets (768px - 992px)
- Desktop (> 992px)

## 🔧 Development Mode

When running in development:
- Frontend: Hot reload enabled
- Backend: Manual restart required for changes
- Database: PostgreSQL connection required

## 📊 Sample Data

The system supports:
- Employee records with departments
- Leave requests with approval workflow
- Timesheet entries
- Payslip generation

## ⚡ Performance Tips

1. **Backend**: Keep running for API access
2. **Frontend**: Uses React hot reload for instant updates
3. **Database**: Ensure PostgreSQL is running
4. **Browser**: Use modern browsers for best experience

## 🎭 Branding Elements

- **Company**: Skyraksys Technologies
- **System**: Employee Management System
- **Theme**: Professional Blue
- **Logo**: Building icon with company name

---

**Ready to use!** Start both servers and navigate to http://localhost:3000 to see the modernized HRM system.
