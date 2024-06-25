import { IAuth } from "../../src/schemas/auth.ts";

declare module "fastify" {
    export interface FastifyRequest {
      user: IAuth
    }
  }