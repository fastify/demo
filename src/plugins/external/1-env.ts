import fp from "fastify-plugin";
import env from "@fastify/env";

const schema = {
  type: "object",
  required: [
    "MYSQL_HOST",
    "MYSQL_PORT",
    "MYSQL_USER",
    "MYSQL_PASSWORD",
    "MYSQL_DATABASE"
  ],
  properties: {
    MYSQL_HOST: {
      type: "string",
      default: "localhost"
    },
    MYSQL_PORT: {
      type: "number",
      default: 3306
    },
    MYSQL_USER: {
      type: "string"
    },
    MYSQL_PASSWORD: {
      type: "string"
    },
    MYSQL_DATABASE: {
      type: "string"
    }
  }
};

const options = {
  // Decorate Fastify instance with `config` key
  // Optional, default: 'config'
  confKey: "config",

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
};

/**
 * This plugins helps to check environment variables.
 *
 * @see https://github.com/fastify/fastify-env
 */
export default fp(async function (fastify) {
  fastify.register(env, options);
});
