import fp from 'fastify-plugin'
import { BusboyFileStream } from '@fastify/busboy'
import { FastifyInstance } from 'fastify'
import path from 'path'
import { pipeline } from 'node:stream/promises'
import fs from 'node:fs'

declare module 'fastify' {
  export interface FastifyInstance {
    fileHandler: {
      upload: (fileDir: string, fileName: string, file: BusboyFileStream) => Promise<void>
      remove: (fileDir: string, fileName: string) => Promise<void>
    }
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

async function upload (this: FastifyInstance, fileDir: string, fileName: string, file: BusboyFileStream) {
  const filePath = buildFilePath(this, fileName, fileDir)

  await pipeline(file, fs.createWriteStream(filePath))
}

async function remove (this: FastifyInstance, fileDir: string, fileName: string) {
  const filePath = buildFilePath(this, fileName, fileDir)

  try {
    await fs.promises.unlink(filePath)
  } catch (err) {
    if (isErrnoException(err) && err.code === 'ENOENT') {
      // A file could have been deleted by an external actor, e.g. system administrator.
      // We log the error to keep a record of the failure, but consider that the operation was successful.
      this.log.warn(`File path '${fileName}' not found`)
    } else {
      throw err
    }
  }
}

function isErrnoException (error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}

export default fp(async (fastify) => {
  fastify.decorate('fileHandler', {
    upload: upload.bind(fastify),
    remove: remove.bind(fastify)
  })
}, { name: 'file-handler' })
