
# Testing Framework Documentation

## Overview
Comprehensive testing setup for the SkyrakSys HRM system with:
- Frontend component testing with React Testing Library
- Backend API testing with Jest and Supertest  
- Integration testing for workflows
- End-to-end testing with Cypress

## Setup
```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom supertest
```

## Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm run test:frontend
npm run test:backend

# Watch mode for development
npm run test:watch
```

## Test Structure
- **Frontend Tests**: Component behavior, user interactions, state management
- **Backend Tests**: API endpoints, business logic, database operations
- **Integration Tests**: End-to-end workflows, data flow verification
- **Performance Tests**: Load testing, memory leak detection

## Coverage Targets
- **Frontend**: 70% coverage minimum
- **Backend**: 80% coverage minimum
- **Critical Paths**: 90% coverage required

## Generated Files
- jest.config.js
- frontend/src/utils/testUtils.js
- backend/tests/testUtils.js
- frontend/src/components/WeeklyTimesheet.test.js
- backend/routes/employee.test.js
