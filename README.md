# Fastify Official Demo

[![CI](https://github.com/fastify/demo/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/fastify/demo/actions/workflows/ci.yml)

The aim of this repository is to provide a concrete example of a Fastify application using what are considered best practices by the Fastify community.

**Prerequisites:** You need to have Node.js version 22 or higher installed.

## About the Application

This demo is a simple task management API. 
It allows users to create, retrieve, update, and delete tasks.
Additional features include file uploads, CSV downloads, task assignment, and role-based access control.

## Getting started
Install the dependencies:
```bash
npm install
```

### Database
You can run a MySQL instance with Docker:
```bash
docker compose up
```

To run it in the background:
```bash
docker compose up -d
```

To create the database, run:
```bash
npm run db:create
```

To create and update the database schema, run the migrations:
```bash
npm run db:migrate
```

To populate the database with initial data, run:
```bash
npm run db:seed
```

To drop the database, run:
```bash
npm run db:drop
```

### TypeScript
To build the project:
```bash
npm run build
```

### Start the server
In dev mode:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

In production mode:
```bash
npm run start
```

### API Documentation

The application exposes interactive API documentation using Swagger UI.

Once the server is running, visit: http://localhost:3000/api/docs

### Testing
To run the tests:
```bash
npm run test
```

### Standalone
`dev` and `start` leverage [fastify-cli](https://github.com/fastify/fastify-cli),
but you can run the demo as a standalone executable (see [server.ts](./src/server.ts)):
```bash
npm run standalone
```

### Linting
To check for linting errors:
```bash
npm run lint
```

To check and automatically fix linting errors:
```bash
npm run lint:fix
```

## Learn More
To learn more about Fastify, check out the [Fastify documentation](https://www.fastify.io/docs/latest/).
