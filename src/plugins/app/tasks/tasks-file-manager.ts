import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import path from 'path'
import fastifyMultipart from '../../external/multipart.js'
import { FileManager, kFileManager } from '../file-manager.js'

export type TasksFileManager = ReturnType<typeof createUploader>
export const kTasksFileManager = Symbol('app.tasksFileManager')

function createUploader (fastify: FastifyInstance) {
  const fileManager = fastify.getDecorator<FileManager>(kFileManager)

  const uploadPath = path.join(
    import.meta.dirname,
    '../../../..',
    fastify.config.UPLOAD_DIRNAME,
    fastify.config.UPLOAD_TASKS_DIRNAME
  )

  const tempPath = path.join(uploadPath, 'temp')

  fileManager.ensureDir(uploadPath)
  fileManager.ensureDir(tempPath)

  const buildFilePath = (filename: string) => fileManager.safeJoin(uploadPath, filename)
  const buildTempFilePath = (filename: string) => fileManager.safeJoin(tempPath, filename)

  return {
    async upload (filename: string, file: fastifyMultipart.MultipartFile) {
      const filePath = buildFilePath(filename)
      await fileManager.upload(file, filePath)
    },

    async moveOldToTemp (oldFilename: string) {
      const oldPath = buildFilePath(oldFilename)
      const randomPart = fileManager.randomSuffix()
      const oldTempFilename = `temp-${randomPart}-${oldFilename}`
      const tempFilePath = buildTempFilePath(oldTempFilename)

      await fileManager.move(oldPath, tempFilePath)
      return oldTempFilename
    },

    async moveTempToOld (tempFilename: string, oldFilename: string) {
      const tempPath = buildTempFilePath(tempFilename)
      const oldPath = buildFilePath(oldFilename)

      await fileManager.move(tempPath, oldPath)
    },

    async delete (filename: string) {
      const filePath = buildFilePath(filename)
      await fileManager.unlink(filePath)
    },

    buildFilePath
  }
}

export default fp(async (fastify) => {
  fastify.decorate(kTasksFileManager, createUploader(fastify))
}, {
  name: 'tasks-file-manager',
  dependencies: ['file-manager']
})
