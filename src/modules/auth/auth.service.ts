import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';


interface AuthService {
  login(): void;
}

declare module 'fastify' {
  export interface FastifyInstance {
    authService: AuthService;
  }
}

function createAuthService(fastify: FastifyInstance) {
  return {
    login() {}
  };
}

export default fp(
  async function (fastify) {
  fastify.decorate('authService', createAuthService(fastify));
}, { name: 'authService' });

