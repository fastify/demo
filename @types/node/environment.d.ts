declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: number;
      LOG_LEVEL: string;
      FASTIFY_CLOSE_GRACE_DELAY: number;
      MYSQL_HOST: string
      MYSQL_PORT: number
      MYSQL_DATABASE: string
      MYSQL_USER: string
      MYSQL_PASSWORD: string
    }
  }
}

export {}
