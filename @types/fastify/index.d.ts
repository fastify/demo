import { MySQLPromisePool } from "@fastify/mysql";
import { Static } from "@sinclair/typebox";
import { CredentialsSchema } from "../../src/schemas/auth.ts";
import { IRepository } from '../../src/plugins/custom/repository.ts'

declare module "fastify" {
  export interface FastifyInstance {
    mysql: MySQLPromisePool;
    repository: IRepository;
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
