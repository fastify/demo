import { ReturnType } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'node:stream/promises'
import fastifyMultipart from '../../external/multipart.js'

declare module 'fastify' {
  export interface FastifyInstance {
    tasksFileManager: ReturnType<typeof createUploader>;
  }
}

function createUploader (fastify: FastifyInstance) {
  function buildFilePath (filename: string) {
    return path.join(
      import.meta.dirname,
      '../../../..',
      fastify.config.UPLOAD_DIRNAME,
      fastify.config.UPLOAD_TASKS_DIRNAME,
      filename
    )
  }

  return {
    async upload (filename: string, file: fastifyMultipart.MultipartFile) {
      const filePath = buildFilePath(filename)

      await pipeline(file.file, fs.createWriteStream(filePath))
    },

    async delete (filename: string) {
      const filePath = buildFilePath(filename)

      try {
        await fs.promises.unlink(filePath)
      } catch (err) {
        if (isErrnoException(err) && err.code === 'ENOENT') {
          // A file could have been deleted by an external actor, e.g. system administrator.
          // We log the error to keep a record of the failure, but consider that the operation was successful.
          fastify.log.warn(`File path '${filename}' not found`)
        } else {
          throw err
        }
      }
    }
  }
}

function isErrnoException (error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}

export default fp(
  function (fastify) {
    fastify.decorate('tasksFileManager', createUploader(fastify))
  },
  {
    name: 'tasks-file-manager'
  }
)
