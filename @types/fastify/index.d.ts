import { MySQLPromisePool } from "@fastify/mysql";
import { Static } from "@sinclair/typebox";
import { CredentialsSchema } from "../../src/schemas/auth.ts";

declare module "fastify" {
  export interface FastifyInstance {
    someSupport(): void;
    mysql: MySQLPromisePool;
    config: {
      PORT: number;
      MYSQL_HOST: string;
      MYSQL_PORT: string;
      MYSQL_USER: string;
      MYSQL_PASSWORD: string;
      MYSQL_DATABASE: string;
      JWT_SECRET: string;
    };
  }

  export interface FastifyRequest {
    user: Static<typeof CredentialsSchema>
  }
}

export {};
