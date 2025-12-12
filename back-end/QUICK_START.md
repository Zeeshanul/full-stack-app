# Quick Start Guide

## Start the Application with Docker

1. **Start both backend and database:**
   ```bash
   docker-compose up -d
   ```

2. **Check the logs:**
   ```bash
   docker-compose logs -f backend
   ```

3. **Test the API:**
   ```bash
   # Health check
   curl http://localhost:3000/health
   
   # Get all users
   curl http://localhost:3000/users
   
   # Create a user
   curl -X POST http://localhost:3000/users \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "name": "Test User",
       "isActive": true
     }'
   ```

4. **Stop the application:**
   ```bash
   docker-compose down
   ```

## Local Development (without Docker)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start PostgreSQL database:**
   ```bash
   docker-compose up postgres -d
   ```

3. **Run the application:**
   ```bash
   npm run start:dev
   ```

4. **Access the application:**
   - API: http://localhost:3000
   - Health: http://localhost:3000/health

## Rebuild Docker Images

If you make changes to dependencies or Dockerfile:
```bash
docker-compose up --build
```

## Access PostgreSQL Database

```bash
docker-compose exec postgres psql -U postgres -d nestjs_db
```

Common PostgreSQL commands:
- `\dt` - List all tables
- `\d users` - Describe users table
- `SELECT * FROM users;` - Query users table
- `\q` - Quit

## Useful Commands

- `npm run build` - Build the application
- `npm run start:dev` - Start in development mode
- `npm run start:prod` - Start in production mode
- `docker-compose ps` - Check running containers
- `docker-compose down -v` - Stop and remove volumes
