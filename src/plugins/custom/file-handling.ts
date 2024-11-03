import fp from 'fastify-plugin'
import { BusboyFileStream } from '@fastify/busboy'
import { FastifyInstance } from 'fastify'
import path from 'path'
import { pipeline } from 'node:stream/promises'
import fs from 'node:fs'

declare module 'fastify' {
  export interface FastifyInstance {
    fileHandler: ReturnType<typeof fileHandlerFactory>
  }
}

function buildFilePath (fastify: FastifyInstance, fileDir: string, filename: string) {
  return path.join(
    import.meta.dirname,
    '../../../',
    fastify.config.UPLOAD_DIRNAME,
    fileDir,
    filename
  )
}

function createFileHandler (fastify: FastifyInstance) {
  async function upload (fileDir: string, fileName: string, file: BusboyFileStream) {
    const filePath = buildFilePath(fastify, fileDir, fileName)

    await pipeline(file, fs.createWriteStream(filePath))
  }

  async function remove (fileDir: string, fileName: string) {
    const filePath = buildFilePath(fastify, fileDir, fileName)

    try {
      await fs.promises.unlink(filePath)
    } catch (err) {
      if (isErrnoException(err) && err.code === 'ENOENT') {
        // A file could have been deleted by an external actor, e.g. system administrator.
        // We log the error to keep a record of the failure, but consider that the operation was successful.
        fastify.log.warn(`File path '${fileName}' not found`)
      } else {
        throw err
      }
    }
  }

  return {
    upload,
    remove
  }
}

function isErrnoException (error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}

export default fp(async (fastify) => {
  fastify.decorate('fileHandler', createFileHandler(fastify))
}, { name: 'file-handler' })
