import env from '@fastify/env'

declare module 'fastify' {
  export interface FastifyInstance {
    config: {
      PORT: number;
      MYSQL_HOST: string;
      MYSQL_PORT: string;
      MYSQL_USER: string;
      MYSQL_PASSWORD: string;
      MYSQL_DATABASE: string;
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
    'MYSQL_HOST',
    'MYSQL_PORT',
    'MYSQL_USER',
    'MYSQL_PASSWORD',
    'MYSQL_DATABASE',
    'COOKIE_SECRET',
    'COOKIE_NAME',
    'COOKIE_SECURED'
  ],
  properties: {
    // Database
    MYSQL_HOST: {
      type: 'string',
      default: 'localhost'
    },
    MYSQL_PORT: {
      type: 'number',
      default: 3306
    },
    MYSQL_USER: {
      type: 'string'
    },
    MYSQL_PASSWORD: {
      type: 'string'
    },
    MYSQL_DATABASE: {
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
