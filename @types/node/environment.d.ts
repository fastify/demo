declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production'
      PORT?: number
      FASTIFY_CLOSE_GRACE_DELAY?: number
    }
  }
}

export {}
