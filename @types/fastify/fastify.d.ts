import { Auth } from '../../src/schemas/auth.ts'

declare module 'fastify' {
  export interface FastifyRequest {
    user: Auth
  }
}
