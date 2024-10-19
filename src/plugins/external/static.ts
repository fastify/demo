import fastifyStatic, { FastifyStaticOptions } from '@fastify/static'
import { FastifyInstance } from 'fastify'
import path from 'path'

export const autoConfig = (fastify: FastifyInstance): FastifyStaticOptions => ({
  root: path.join(import.meta.dirname, '../../..'),
  prefix: `/${fastify.config.UPLOAD_DIRNAME}`
})

export default fastifyStatic
