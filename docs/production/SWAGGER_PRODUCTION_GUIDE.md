# Swagger Documentation Deployment Guide

## Local Development

### Access Swagger UI:
```
http://localhost:5000/api/docs
```

### Access Swagger JSON:
```
http://localhost:5000/api/docs.json
```

## Production Deployment

### Environment Variables Required:

```bash
# .env file
NODE_ENV=production
API_BASE_URL=https://your-production-domain.com/api
PORT=5000

# Optional Swagger customization
SWAGGER_TITLE="SKYRAKSYS HRM API"
SWAGGER_DESCRIPTION="Production Payslip Management API"
SWAGGER_VERSION="1.0.0"
```

### Production URLs:

#### Swagger UI (Interactive Documentation):
```
https://your-production-domain.com/api/docs
```

#### Swagger JSON (API Specification):
```
https://your-production-domain.com/api/docs.json
```

### Security Considerations for Production:

1. **Disable Swagger in Production (Optional)**:
   ```javascript
   // In server.js, conditionally enable Swagger
   if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
     app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
   }
   ```

2. **Restrict Access to Swagger UI**:
   ```javascript
   // Add authentication middleware for Swagger
   app.use('/api/docs', 
     authenticateToken, 
     authorizeRoles(['admin']), 
     swaggerUi.serve, 
     swaggerUi.setup(specs, swaggerOptions)
   );
   ```

3. **Custom Domain Configuration**:
   ```javascript
   // Update swagger.js servers config
   servers: [
     {
       url: 'https://api.yourcompany.com/api',
       description: 'Production API Server'
     },
     {
       url: 'https://staging-api.yourcompany.com/api', 
       description: 'Staging API Server'
     },
     {
       url: 'http://localhost:5000/api',
       description: 'Development Server'
     }
   ]
   ```

## Nginx Configuration for Production

```nginx
server {
    listen 80;
    server_name api.yourcompany.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourcompany.com;
    
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    location /api/docs {
        proxy_pass http://localhost:5000/api/docs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Docker Configuration

```dockerfile
# Dockerfile for production
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start application
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  hrm-api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - API_BASE_URL=https://api.yourcompany.com/api
      - ENABLE_SWAGGER=true
    depends_on:
      - postgres
      
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: hrm_db
      POSTGRES_USER: hrm_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
volumes:
  postgres_data:
```

## API Documentation Features

### Comprehensive Coverage:
- ✅ All payslip management endpoints
- ✅ Template configuration APIs  
- ✅ Salary structure management
- ✅ Payroll data processing
- ✅ Authentication & authorization
- ✅ Request/response schemas
- ✅ Error handling examples

### Interactive Features:
- ✅ Try-it-out functionality
- ✅ Authentication token input
- ✅ Request/response examples
- ✅ Schema validation
- ✅ Download OpenAPI specification

### Production URLs Summary:

| Environment | Swagger UI URL | JSON Spec URL |
|-------------|----------------|---------------|
| Local | http://localhost:5000/api/docs | http://localhost:5000/api/docs.json |
| Staging | https://staging-api.yourcompany.com/api/docs | https://staging-api.yourcompany.com/api/docs.json |
| Production | https://api.yourcompany.com/api/docs | https://api.yourcompany.com/api/docs.json |

## Usage Instructions:

1. **For Developers**: Use the interactive Swagger UI to test APIs during development
2. **For Frontend Teams**: Reference the documentation for API integration
3. **For QA Teams**: Use the documentation for API testing scenarios
4. **For DevOps**: Use the JSON specification for API gateway configuration

## Security Note:
In production, consider restricting Swagger UI access to internal users only or implementing authentication for the documentation endpoints.