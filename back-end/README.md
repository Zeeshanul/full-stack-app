# NestJS Backend with PostgreSQL

A Dockerized NestJS backend application with PostgreSQL database.

## Features

- **NestJS Framework**: Modern Node.js framework for building server-side applications
- **PostgreSQL**: Robust relational database
- **TypeORM**: ORM for TypeScript and JavaScript
- **Docker**: Containerized application for easy deployment
- **Validation**: Built-in request validation with class-validator
- **CORS**: Cross-origin resource sharing enabled

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- npm or yarn

## Getting Started

### Using Docker (Recommended)

1. Start the application with Docker Compose:
```bash
docker-compose up -d
```

2. The backend will be available at `http://localhost:3000`

3. Stop the application:
```bash
docker-compose down
```

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Start PostgreSQL (using Docker):
```bash
docker run --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=nestjs_db -p 5432:5432 -d postgres:16-alpine
```

4. Run the application in development mode:
```bash
npm run start:dev
```

## Available Scripts

- `npm run build` - Build the application
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with watch
- `npm run start:prod` - Start in production mode
- `npm run lint` - Lint the code
- `npm run format` - Format the code

## API Endpoints

### Health Check
- `GET /health` - Check if the API is running

### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create a new user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Example User Request
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "isActive": true
  }'
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Application port | 3000 |
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_USERNAME | Database username | postgres |
| DB_PASSWORD | Database password | postgres |
| DB_NAME | Database name | nestjs_db |

## Project Structure

```
back-end/
├── src/
│   ├── users/              # Users module
│   │   ├── dto/           # Data Transfer Objects
│   │   ├── entities/      # TypeORM entities
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── app.controller.ts  # Main controller
│   ├── app.service.ts     # Main service
│   ├── app.module.ts      # Main module
│   └── main.ts           # Application entry point
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile           # Development Dockerfile
├── Dockerfile.prod      # Production Dockerfile
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Docker Commands

Build and start:
```bash
docker-compose up --build
```

View logs:
```bash
docker-compose logs -f backend
```

Access database:
```bash
docker-compose exec postgres psql -U postgres -d nestjs_db
```

## Production Deployment

Use the production Dockerfile for optimized builds:
```bash
docker build -f Dockerfile.prod -t backend-prod .
docker run -p 3000:3000 --env-file .env.production backend-prod
```

## License

ISC
