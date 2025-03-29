import fastifyStatic, { FastifyStaticOptions } from '@fastify/static'
import { FastifyInstance } from 'fastify'
import fs from 'fs'
import path from 'path'

export const autoConfig = (fastify: FastifyInstance): FastifyStaticOptions => {
  const dirPath = path.join(import.meta.dirname, '../../..', fastify.config.UPLOAD_DIRNAME)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath)
  }

  return {
    root: path.join(import.meta.dirname, '../../..'),
    prefix: `/${fastify.config.UPLOAD_DIRNAME}`
  }
}

/**
 * This plugins allows to serve static files as fast as possible.
 *
 * @see {@link https://github.com/fastify/fastify-static}
 */
export default fastifyStatic
