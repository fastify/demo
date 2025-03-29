import { ReturnType } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'node:stream/promises'
import fastifyMultipart from '../../external/multipart.js'
import * as crypto from 'node:crypto'

declare module 'fastify' {
  export interface FastifyInstance {
    tasksFileManager: ReturnType<typeof createUploader>;
  }
}

function createUploader (fastify: FastifyInstance) {
  const uploadPath = path.join(
    import.meta.dirname,
    '../../../..',
    fastify.config.UPLOAD_DIRNAME,
    fastify.config.UPLOAD_TASKS_DIRNAME
  )
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath)
  }

  function buildFilePath (filename: string) {
    return path.join(uploadPath, filename)
  }

  const tempPath = path.join(uploadPath, 'temp')
  if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath)
  }

  function buildTempFilePath (filename: string) {
    return path.join(tempPath, filename)
  }

  async function safeUnlink (filePath: string) {
    try {
      await fs.promises.unlink(filePath)
    } catch (err) {
      if (isErrnoException(err) && err.code === 'ENOENT') {
        fastify.log.warn(`File path '${filePath}' not found`)
      } else {
        throw err
      }
    }
  }

  return {
    async upload (filename: string, file: fastifyMultipart.MultipartFile) {
      const filePath = buildFilePath(filename)

      await pipeline(file.file, fs.createWriteStream(filePath))
    },

    async moveOldToTemp (oldFilename: string) {
      const oldPath = buildFilePath(oldFilename)

      const randomPart = crypto.randomBytes(8).toString('hex')
      const oldTempFilename = `temp-${randomPart}-${oldFilename}`
      const tempPath = buildTempFilePath(oldTempFilename)

      await fs.promises.rename(oldPath, tempPath)

      return oldTempFilename
    },

    async moveTempToOld (tempFilename: string, oldFilename: string) {
      const tempPath = buildTempFilePath(tempFilename)
      const oldPath = buildFilePath(oldFilename)

      // We rename or move the file. If both are on the same volume, fs.rename is enough.
      // Otherwise you might need to copy + remove.
      await fs.promises.rename(tempPath, oldPath)
    },

    async delete (filename: string) {
      const filePath = buildFilePath(filename)

      await safeUnlink(filePath)
    },
    buildFilePath
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
