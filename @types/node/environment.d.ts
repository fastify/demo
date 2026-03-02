declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: number;
      LOG_LEVEL: string;
      FASTIFY_CLOSE_GRACE_DELAY: number;
      POSTGRES_HOST: string
      POSTGRES_PORT: number
      POSTGRES_DATABASE: string
      POSTGRES_USER: string
      POSTGRES_PASSWORD: string
    }
  }
}

export {}
