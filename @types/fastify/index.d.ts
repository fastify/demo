import { MySQLPromisePool } from "@fastify/mysql";

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
    };
  }
}

export {};
