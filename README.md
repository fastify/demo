# Fastify Official Demo

![CI](https://github.com/fastify/demo/workflows/CI/badge.svg)

> :warning: **Please note:** This repository is still under active development.

The aim of this repository is to provide a concrete example of a Fastify application using what are considered best practices by the Fastify community.

**Prerequisites:** You need to have Node.js version 22 or higher.

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

Or to run it in the background:
```bash
docker compose up -d
```

To create and update the database schema, run the migrations:
```bash
npm run db:migrate
```

To populate the database with initial data, run:
```bash
npm run db:seed
```

### TypeScript
To build the project:
```bash
npm run build
```

In dev mode, you can use:
```bash
npm run watch
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

### Testing
Run the test cases:
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
Check for linting errors:
```bash
npm run lint
```

Automatically fix linting errors:
```bash
npm run lint:fix
```

## Learn More
To learn more about Fastify, check out the [Fastify documentation](https://www.fastify.io/docs/latest/).
