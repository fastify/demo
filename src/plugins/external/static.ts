import fastifyStatic, { FastifyStaticOptions } from '@fastify/static'
import { FastifyInstance } from 'fastify'
import fs from 'node:fs'
import path from 'node:path'

export const autoConfig = (fastify: FastifyInstance): FastifyStaticOptions => {
  const dirPath = path.join(import.meta.dirname, '../../..', fastify.config.UPLOAD_DIRNAME)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath)
  }

  const dirTasksPath = path.join(dirPath, fastify.config.UPLOAD_TASKS_DIRNAME)
  if (!fs.existsSync(dirTasksPath)) {
    fs.mkdirSync(dirTasksPath)
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
