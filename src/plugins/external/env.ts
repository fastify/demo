import env from '@fastify/env'

declare module 'fastify' {
  export interface FastifyInstance {
    config: {
      PORT: number;
      POSTGRES_HOST: string;
      POSTGRES_PORT: string;
      POSTGRES_USER: string;
      POSTGRES_PASSWORD: string;
      POSTGRES_DATABASE: string;
      COOKIE_SECRET: string;
      COOKIE_NAME: string;
      COOKIE_SECURED: boolean;
      RATE_LIMIT_MAX: number;
      UPLOAD_DIRNAME: string;
      UPLOAD_TASKS_DIRNAME: string;
    };
  }
}

const schema = {
  type: 'object',
  required: [
    'POSTGRES_HOST',
    'POSTGRES_PORT',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DATABASE',
    'COOKIE_SECRET',
    'COOKIE_NAME',
    'COOKIE_SECURED'
  ],
  properties: {
    // Database
    POSTGRES_HOST: {
      type: 'string',
      default: 'localhost'
    },
    POSTGRES_PORT: {
      type: 'number',
      default: 5432
    },
    POSTGRES_USER: {
      type: 'string'
    },
    POSTGRES_PASSWORD: {
      type: 'string'
    },
    POSTGRES_DATABASE: {
      type: 'string'
    },

    // Security
    COOKIE_SECRET: {
      type: 'string'
    },
    COOKIE_NAME: {
      type: 'string'
    },
    COOKIE_SECURED: {
      type: 'boolean',
      default: true
    },
    RATE_LIMIT_MAX: {
      type: 'number',
      default: 100 // Put it to 4 in your .env file for tests
    },

    // Files
    UPLOAD_DIRNAME: {
      type: 'string',
      minLength: 1,
      pattern: '^(?!.*\\.{2}).*$',
      default: 'uploads'
    },
    UPLOAD_TASKS_DIRNAME: {
      type: 'string',
      default: 'tasks'
    }
  }
}

export const autoConfig = {
  // Decorate Fastify instance with `config` key
  // Optional, default: 'config'
  confKey: 'config',

  // Schema to validate
  schema,

  // Needed to read .env in root folder
  dotenv: true,
  // or, pass config options available on dotenv module
  // dotenv: {
  //   path: `${import.meta.dirname}/.env`,
  //   debug: true
  // }

  // Source for the configuration data
  // Optional, default: process.env
  data: process.env
}

/**
 * This plugins helps to check environment variables.
 *
 * @see {@link https://github.com/fastify/fastify-env}
 */
export default env
