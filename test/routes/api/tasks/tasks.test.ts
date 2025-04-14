import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert'
import { build, expectValidationError } from '../../../helper.js'
import {
  Task,
  TaskStatusEnum,
  TaskPaginationResultSchema
} from '../../../../src/schemas/tasks.js'
import { FastifyInstance } from 'fastify'
import { Static } from '@sinclair/typebox'
import fs from 'node:fs'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'
import FormData from 'form-data'
import os from 'node:os'
import { gunzipSync } from 'node:zlib'

async function createUser (
  app: FastifyInstance,
  userData: Partial<{ email: string; username: string; password: string }>
) {
  const [id] = await app.knex('users').insert(userData)
  return id
}

async function createTask (app: FastifyInstance, taskData: Partial<Task>) {
  const [id] = await app.knex<Task>('tasks').insert(taskData)

  return id
}

async function uploadImageForTask (
  app: FastifyInstance,
  taskId: number,
  filePath: string,
  uploadDir: string
) {
  await app
    .knex<Task>('tasks')
    .where({ id: taskId })
    .update({ filename: `${taskId}_short-logo.png` })

  const file = fs.createReadStream(filePath)
  const filename = `${taskId}_short-logo.png`

  const writeStream = fs.createWriteStream(path.join(uploadDir, filename))

  await pipeline(file, writeStream)
}

describe('Tasks api (logged user only)', () => {
  describe('GET /api/tasks', () => {
    let app: FastifyInstance
    let userId1: number
    let userId2: number

    let firstTaskId: number

    before(async () => {
      app = await build()

      userId1 = await createUser(app, {
        username: 'user1',
        email: 'user1@example.com',
        password: 'password1'
      })
      userId2 = await createUser(app, {
        username: 'user2',
        email: 'user2@example.com',
        password: 'password2'
      })

      firstTaskId = await createTask(app, {
        name: 'Task 1',
        author_id: userId1,
        status: TaskStatusEnum.New
      })
      await createTask(app, {
        name: 'Task 2',
        author_id: userId1,
        assigned_user_id: userId2,
        status: TaskStatusEnum.InProgress
      })
      await createTask(app, {
        name: 'Task 3',
        author_id: userId2,
        status: TaskStatusEnum.Completed
      })
      await createTask(app, {
        name: 'Task 4',
        author_id: userId1,
        assigned_user_id: userId1,
        status: TaskStatusEnum.OnHold
      })

      app.close()
    })

    it('should return a list of tasks with no pagination filter', async (t) => {
      app = await build(t)

      const res = await app.injectWithLogin('basic@example.com', {
        method: 'GET',
        url: '/api/tasks'
      })

      assert.strictEqual(res.statusCode, 200)
      const { tasks, total } = JSON.parse(res.payload) as Static<
        typeof TaskPaginationResultSchema
      >
      const firstTask = tasks.find((task) => task.id === firstTaskId)

      assert.ok(firstTask, 'Created task should be in the response')
      assert.deepStrictEqual(firstTask.name, 'Task 1')
      assert.strictEqual(firstTask.author_id, userId1)
      assert.strictEqual(firstTask.status, TaskStatusEnum.New)

      assert.strictEqual(total, 4)
    })

    it('should paginate by page and limit', async (t) => {
      app = await build(t)
      const res = await app.injectWithLogin('basic@example.com', {
        method: 'GET',
        url: '/api/tasks',
        query: { page: '2', limit: '1' }
      })

      assert.strictEqual(res.statusCode, 200)
      const { tasks, total } = JSON.parse(res.payload) as Static<
        typeof TaskPaginationResultSchema
      >

      assert.strictEqual(total, 4)
      assert.strictEqual(tasks.length, 1)
      assert.strictEqual(tasks[0].name, 'Task 2')
      assert.strictEqual(tasks[0].author_id, userId1)
      assert.strictEqual(tasks[0].status, TaskStatusEnum.InProgress)
    })

    it('should filter tasks by assigned_user_id', async (t) => {
      app = await build(t)

      const res = await app.injectWithLogin('basic@example.com', {
        method: 'GET',
        url: '/api/tasks',
        query: { assigned_user_id: userId2.toString() }
      })

      assert.strictEqual(res.statusCode, 200)
      const { tasks, total } = JSON.parse(res.payload) as Static<
        typeof TaskPaginationResultSchema
      >

      assert.strictEqual(total, 1)
      tasks.forEach((task) =>
        assert.strictEqual(task.assigned_user_id, userId2)
      )
    })

    it('should filter tasks by status', async (t) => {
      app = await build(t)
      const res = await app.injectWithLogin('basic@example.com', {
        method: 'GET',
        url: '/api/tasks',
        query: { status: TaskStatusEnum.Completed }
      })

      assert.strictEqual(res.statusCode, 200)
      const { tasks, total } = JSON.parse(res.payload) as Static<
        typeof TaskPaginationResultSchema
      >

      assert.strictEqual(total, 1)
      tasks.forEach((task) =>
        assert.strictEqual(task.status, TaskStatusEnum.Completed)
      )
    })

    it('should paginate and filter tasks by author_id and status', async (t) => {
      app = await build(t)
      const res = await app.injectWithLogin('basic@example.com', {
        method: 'GET',
        url: '/api/tasks',
        query: {
          author_id: userId1.toString(),
          status: TaskStatusEnum.OnHold,
          page: '1',
          limit: '1'
        }
      })

      assert.strictEqual(res.statusCode, 200)
      const { tasks, total } = JSON.parse(res.payload) as Static<
        typeof TaskPaginationResultSchema
      >

      assert.strictEqual(total, 1)
      assert.strictEqual(tasks.length, 1)
      assert.strictEqual(tasks[0].name, 'Task 4')
      assert.strictEqual(tasks[0].author_id, userId1)
      assert.strictEqual(tasks[0].status, TaskStatusEnum.OnHold)
    })

    it('should return empty array and total = 0 if no tasks', async (t) => {
      app = await build(t)

      await app.knex<Task>('tasks').delete()

      const res = await app.injectWithLogin('basic@example.com', {
        method: 'GET',
        url: '/api/tasks'
      })

      assert.strictEqual(res.statusCode, 200)
      const { tasks, total } = JSON.parse(res.payload) as Static<
        typeof TaskPaginationResultSchema
      >

      assert.strictEqual(total, 0)
      assert.strictEqual(tasks.length, 0)
    })
  })

  describe('GET /api/tasks/:id', () => {
    it('should return a task', async (t) => {
      const app = await build(t)

      const taskData = {
        name: 'Single Task',
        author_id: 1,
        status: TaskStatusEnum.New
      }

      const newTaskId = await createTask(app, taskData)

      const res = await app.injectWithLogin('basic@example.com', {
        method: 'GET',
        url: `/api/tasks/${newTaskId}`
      })

      assert.strictEqual(res.statusCode, 200)
      const task = JSON.parse(res.payload) as Task
      assert.equal(task.id, newTaskId)
    })

    it('should return 404 if task is not found', async (t) => {
      const app = await build(t)

      const res = await app.injectWithLogin('basic@example.com', {
        method: 'GET',
        url: '/api/tasks/9999'
      })

      assert.strictEqual(res.statusCode, 404)
      const payload = JSON.parse(res.payload)
      assert.strictEqual(payload.message, 'Task not found')
    })
  })

  describe('POST /api/tasks', () => {
    it('should return 400 if task creation payload is invalid', async (t) => {
      const app = await build(t)

      const invalidTaskData = {
        name: ''
      }

      const res = await app.injectWithLogin('basic@example.com', {
        method: 'POST',
        url: '/api/tasks',
        payload: invalidTaskData
      })

      expectValidationError(res, 'body/name must NOT have fewer than 1 characters')
    })

    it('should create a new task', async (t) => {
      const app = await build(t)

      const taskData = {
        name: 'New Task'
      }

      const res = await app.injectWithLogin('basic@example.com', {
        method: 'POST',
        url: '/api/tasks',
        payload: taskData
      })

      assert.strictEqual(res.statusCode, 201)
      const { id } = JSON.parse(res.payload)

      const createdTask = await app.knex<Task>('tasks').where({ id }).first()
      assert.equal(createdTask?.name, taskData.name)
    })
  })

  describe('PATCH /api/tasks/:id', () => {
    it('should return 400 if task update payload is invalid', async (t) => {
      const app = await build(t)

      const invalidUpdateData = {
        name: 'Updated task',
        assigned_user_id: 'abc'
      }

      const res = await app.injectWithLogin('basic@example.com', {
        method: 'PATCH',
        url: '/api/tasks/1',
        payload: invalidUpdateData
      })

      expectValidationError(res, 'body/assigned_user_id must be integer')
    })

    it('should update an existing task', async (t) => {
      const app = await build(t)

      const taskData = {
        name: 'Task to Update',
        author_id: 1,
        status: TaskStatusEnum.New
      }
      const newTaskId = await createTask(app, taskData)

      const updatedData = {
        name: 'Updated Task'
      }

      const res = await app.injectWithLogin('basic@example.com', {
        method: 'PATCH',
        url: `/api/tasks/${newTaskId}`,
        payload: updatedData
      })

      assert.strictEqual(res.statusCode, 200)
      const updatedTask = await app
        .knex<Task>('tasks')
        .where({ id: newTaskId })
        .first()
      assert.equal(updatedTask?.name, updatedData.name)
    })

    it('should return 404 if task is not found for update', async (t) => {
      const app = await build(t)

      const updatedData = {
        name: 'Updated Task'
      }

      const res = await app.injectWithLogin('basic@example.com', {
        method: 'PATCH',
        url: '/api/tasks/9999',
        payload: updatedData
      })

      assert.strictEqual(res.statusCode, 404)
      const payload = JSON.parse(res.payload)
      assert.strictEqual(payload.message, 'Task not found')
    })
  })

  describe('DELETE /api/tasks/:id', () => {
    const taskData = {
      name: 'Task to Delete',
      author_id: 1,
      status: TaskStatusEnum.New
    }

    it('should delete an existing task', async (t) => {
      const app = await build(t)
      const newTaskId = await createTask(app, taskData)

      const res = await app.injectWithLogin('admin@example.com', {
        method: 'DELETE',
        url: `/api/tasks/${newTaskId}`
      })

      assert.strictEqual(res.statusCode, 204)

      const deletedTask = await app
        .knex<Task>('tasks')
        .where({ id: newTaskId })
        .first()
      assert.strictEqual(deletedTask, undefined)
    })

    it('should return 404 if task is not found for deletion', async (t) => {
      const app = await build(t)

      const res = await app.injectWithLogin('admin@example.com', {
        method: 'DELETE',
        url: '/api/tasks/9999'
      })

      assert.strictEqual(res.statusCode, 404)
      const payload = JSON.parse(res.payload)
      assert.strictEqual(payload.message, 'Task not found')
    })
  })

  describe('POST /api/tasks/:id/assign', () => {
    it('should return 400 if task assignment payload is invalid', async (t) => {
      const app = await build(t)

      const invalidPayload = {
        userId: 'not-a-number'
      }

      const res = await app.injectWithLogin('moderator@example.com', {
        method: 'POST',
        url: '/api/tasks/1/assign',
        payload: invalidPayload
      })

      expectValidationError(res, 'body/userId must be number')
    })

    it('should assign a task to a user and persist the changes', async (t) => {
      const app = await build(t)

      for (const email of ['moderator@example.com', 'admin@example.com']) {
        const taskData = {
          name: 'Task to Assign',
          author_id: 1,
          status: TaskStatusEnum.New
        }
        const newTaskId = await createTask(app, taskData)

        const res = await app.injectWithLogin(email, {
          method: 'POST',
          url: `/api/tasks/${newTaskId}/assign`,
          payload: {
            userId: 2
          }
        })

        assert.strictEqual(res.statusCode, 200)

        const updatedTask = await app
          .knex<Task>('tasks')
          .where({ id: newTaskId })
          .first()
        assert.strictEqual(updatedTask?.assigned_user_id, 2)
      }
    })

    it('should unassign a task from a user and persist the changes', async (t) => {
      const app = await build(t)

      for (const email of ['moderator@example.com', 'admin@example.com']) {
        const taskData = {
          name: 'Task to Unassign',
          author_id: 1,
          assigned_user_id: 2,
          status: TaskStatusEnum.New
        }
        const newTaskId = await createTask(app, taskData)

        const res = await app.injectWithLogin(email, {
          method: 'POST',
          url: `/api/tasks/${newTaskId}/assign`,
          payload: {}
        })

        assert.strictEqual(res.statusCode, 200)

        const updatedTask = await app
          .knex<Task>('tasks')
          .where({ id: newTaskId })
          .first()
        assert.strictEqual(updatedTask?.assigned_user_id, null)
      }
    })

    it('should return 403 if not a moderator', async (t) => {
      const app = await build(t)

      const res = await app.injectWithLogin('basic@example.com', {
        method: 'POST',
        url: '/api/tasks/1/assign',
        payload: {}
      })

      assert.strictEqual(res.statusCode, 403)
    })

    it('should return 404 if task is not found', async (t) => {
      const app = await build(t)

      const res = await app.injectWithLogin('moderator@example.com', {
        method: 'POST',
        url: '/api/tasks/9999/assign',
        payload: {
          userId: 2
        }
      })

      assert.strictEqual(res.statusCode, 404)
      const payload = JSON.parse(res.payload)
      assert.strictEqual(payload.message, 'Task not found')
    })
  })

  describe('Task image upload, retrieval and delete', () => {
    let app: FastifyInstance
    let taskId: number
    const filename = 'short-logo.png'
    const fixturesDir = path.join(import.meta.dirname, './fixtures')
    const testImagePath = path.join(fixturesDir, filename)
    const testCsvPath = path.join(fixturesDir, 'one_line.csv')
    let uploadDir: string
    let uploadDirTask: string

    before(async () => {
      app = await build()
      uploadDir = path.join(import.meta.dirname, '../../../../', app.config.UPLOAD_DIRNAME)
      uploadDirTask = path.join(uploadDir, app.config.UPLOAD_TASKS_DIRNAME)
      assert.ok(fs.existsSync(uploadDir))

      taskId = await createTask(app, {
        name: 'Task with image',
        author_id: 1,
        status: TaskStatusEnum.New
      })

      app.close()
    })

    after(async () => {
      const files = fs.readdirSync(uploadDirTask)
      files.forEach((file) => {
        const filePath = path.join(uploadDirTask, file)
        fs.rmSync(filePath, { recursive: true })
      })

      await app.close()
    })

    describe('Upload', () => {
      it('should create upload directories at boot if not exist', async (t) => {
        fs.rmSync(uploadDir, { recursive: true })
        assert.ok(!fs.existsSync(uploadDir))

        app = await build(t)

        assert.ok(fs.existsSync(uploadDir))
        assert.ok(fs.existsSync(uploadDirTask))
      })

      it('should upload a valid image for a task', async (t) => {
        app = await build(t)

        const form = new FormData()
        form.append('file', fs.createReadStream(testImagePath))

        const res = await app.injectWithLogin('basic@example.com', {
          method: 'POST',
          url: `/api/tasks/${taskId}/upload`,
          payload: form,
          headers: form.getHeaders()
        })

        assert.strictEqual(res.statusCode, 200)

        const { message } = JSON.parse(res.payload)
        assert.strictEqual(message, 'File uploaded successfully')
      })

      it('should return 404 if task not found', async (t) => {
        app = await build(t)

        const form = new FormData()
        form.append('file', fs.createReadStream(testImagePath))

        const res = await app.injectWithLogin('basic@example.com', {
          method: 'POST',
          url: '/api/tasks/100000/upload',
          payload: form,
          headers: form.getHeaders()
        })

        assert.strictEqual(res.statusCode, 404)

        const { message } = JSON.parse(res.payload)
        assert.strictEqual(message, 'Task not found')
      })

      it('should return 404 if file not found', async (t) => {
        app = await build(t)

        const form = new FormData()
        form.append('file', fs.createReadStream(testImagePath))

        const res = await app.injectWithLogin('basic@example.com', {
          method: 'POST',
          url: `/api/tasks/${taskId}/upload`,
          payload: undefined,
          headers: form.getHeaders()
        })

        assert.strictEqual(res.statusCode, 404)

        const { message } = JSON.parse(res.payload)
        assert.strictEqual(message, 'File not found')
      })

      it('should reject an invalid file type', async (t) => {
        app = await build(t)

        const form = new FormData()
        form.append('file', fs.createReadStream(testCsvPath))

        const res = await app.injectWithLogin('basic@example.com', {
          method: 'POST',
          url: `/api/tasks/${taskId}/upload`,
          payload: form,
          headers: form.getHeaders()
        })

        expectValidationError(res, 'Invalid file type')
      })

      it('should reject if file size exceeds limit (truncated)', async (t) => {
        app = await build(t)

        const tmpDir = os.tmpdir()
        const largeTestImagePath = path.join(tmpDir, 'large-test-image.jpg')

        const largeBuffer = Buffer.alloc(1024 * 1024 * 1.5, 'a') // Max file size in bytes is 1 MB
        /**
         * Limit file permissions to read/write for the owner only by setting mode
         * to 0600, as permissions should follow the principle of least privilege.
         * @see {@link https://learn.snyk.io/lesson/insecure-temporary-file/?ecosystem=javascript | Insecure temporary file}
         */
        fs.writeFileSync(largeTestImagePath, largeBuffer, { mode: 0o600 })

        const form = new FormData()
        form.append('file', fs.createReadStream(largeTestImagePath))

        const res = await app.injectWithLogin('basic@example.com', {
          method: 'POST',
          url: `/api/tasks/${taskId}/upload`,
          payload: form,
          headers: form.getHeaders()
        })

        expectValidationError(res, 'File size limit exceeded')
      })

      it('File upload transaction should rollback on error', async (t) => {
        const app = await build(t)

        // Should preserve old file on transaction failure
        const taskFilename = `${taskId}_${filename}`
        const oldFilePath = path.join(uploadDirTask, taskFilename)
        assert.ok(fs.existsSync(oldFilePath))

        const { mock: mockPipeline } = t.mock.method(fs, 'createWriteStream')
        mockPipeline.mockImplementationOnce(() => {
          throw new Error('Kaboom!')
        })

        const { mock: mockLogError } = t.mock.method(app.log, 'error')

        const form = new FormData()
        form.append('file', fs.createReadStream(testImagePath))
        const res = await app.injectWithLogin('basic@example.com', {
          method: 'POST',
          url: `/api/tasks/${taskId}/upload`,
          payload: form,
          headers: form.getHeaders()
        })

        assert.strictEqual(res.statusCode, 500)
        assert.strictEqual(mockLogError.callCount(), 1)

        const arg = mockLogError.calls[0].arguments[0] as unknown as {
          err: Error;
        }

        assert.deepStrictEqual(arg.err.message, 'Kaboom!')
        assert.ok(fs.existsSync(oldFilePath))
      })
    })

    describe('Retrieval', () => {
      it('should retrieve the uploaded image based on task id and filename', async (t) => {
        app = await build(t)

        const taskFilename = encodeURIComponent(`${taskId}_${filename}`)
        const res = await app.injectWithLogin('basic@example.com', {
          method: 'GET',
          url: `/api/tasks/${taskFilename}/image`
        })

        assert.strictEqual(res.statusCode, 200)
        assert.strictEqual(res.headers['content-type'], 'image/png')

        const originalFile = fs.readFileSync(testImagePath)

        assert.deepStrictEqual(originalFile, res.rawPayload)
      })

      it('should return 404 error for non-existant filename', async (t) => {
        app = await build(t)

        const res = await app.injectWithLogin('basic@example.com', {
          method: 'GET',
          url: '/api/tasks/non-existant/image'
        })

        assert.strictEqual(res.statusCode, 404)
        const { message } = JSON.parse(res.payload)
        assert.strictEqual(message, 'No task has filename "non-existant"')
      })
    })

    describe('Deletion', () => {
      before(async () => {
        app = await build()

        await app.knex<Task>('tasks').where({ id: taskId }).update({ filename: null })

        const files = fs.readdirSync(uploadDirTask)
        files.forEach((file) => {
          const filePath = path.join(uploadDirTask, file)
          fs.rmSync(filePath, { recursive: true })
        })

        await app.close()
      })

      beforeEach(async () => {
        app = await build()
        await uploadImageForTask(app, taskId, testImagePath, uploadDirTask)
        await app.close()
      })

      after(async () => {
        const files = fs.readdirSync(uploadDirTask)
        files.forEach((file) => {
          const filePath = path.join(uploadDirTask, file)
          fs.rmSync(filePath, { recursive: true })
        })
      })

      it('should remove an existing image for a task', async (t) => {
        app = await build(t)

        const taskFilename = encodeURIComponent(`${taskId}_${filename}`)
        const res = await app.injectWithLogin('basic@example.com', {
          method: 'DELETE',
          url: `/api/tasks/${taskFilename}/image`
        })

        assert.strictEqual(res.statusCode, 204)
        const files = fs.readdirSync(uploadDirTask)
          .filter((name) => {
            const full = path.join(uploadDirTask, name)
            return fs.statSync(full).isFile() && !name.startsWith('.')
          })
        assert.strictEqual(files.length, 0)
      })

      it('should return 404 for non-existant task with filename for deletion', async (t) => {
        app = await build(t)

        const res = await app.injectWithLogin('basic@example.com', {
          method: 'DELETE',
          url: '/api/tasks/non-existant/image'
        })

        assert.strictEqual(res.statusCode, 404)
        const { message } = JSON.parse(res.payload)
        assert.strictEqual(message, 'No task has filename "non-existant"')
      })

      it('should return 204 for non-existant file in upload dir', async (t) => {
        const app = await build(t)

        await createTask(app, {
          name: 'Task with image',
          author_id: 1,
          status: TaskStatusEnum.New,
          filename: 'does_not_exist.png'
        })

        const { mock: mockLogWarn } = t.mock.method(app.log, 'warn')

        const res = await app.injectWithLogin('basic@example.com', {
          method: 'DELETE',
          url: '/api/tasks/does_not_exist.png/image'
        })

        assert.strictEqual(res.statusCode, 204)

        const arg = mockLogWarn.calls[0].arguments[0]

        assert.strictEqual(mockLogWarn.callCount(), 1)
        const filePath = app.tasksFileManager.buildFilePath('does_not_exist.png')
        assert.deepStrictEqual(arg, `File path '${filePath}' not found`)
      })

      it('File deletion transaction should rollback on error', async (t) => {
        const app = await build(t)
        const { mock: mockPipeline } = t.mock.method(fs.promises, 'unlink')
        mockPipeline.mockImplementationOnce(() => {
          return Promise.reject(new Error('Kaboom!'))
        })

        const { mock: mockLogError } = t.mock.method(app.log, 'error')

        const taskFilename = encodeURIComponent(`${taskId}_${filename}`)
        const res = await app.injectWithLogin('basic@example.com', {
          method: 'DELETE',
          url: `/api/tasks/${taskFilename}/image`
        })

        assert.strictEqual(res.statusCode, 500)
        assert.strictEqual(mockLogError.callCount(), 1)

        const arg = mockLogError.calls[0].arguments[0] as unknown as {
          err: Error;
        }

        assert.deepStrictEqual(arg.err.message, 'Kaboom!')
      })
    })
  })

  describe('GET /api/tasks/download/csv', () => {
    before(async () => {
      const app = await build()
      await app.knex('tasks').del()
      await app.close()
    })

    it('should stream a gzipped CSV file', async (t) => {
      const app = await build(t)

      const tasks = []
      for (let i = 0; i < 1000; i++) {
        tasks.push({
          name: `Task ${i + 1}`,
          author_id: 1,
          assigned_user_id: 2,
          filename: 'task.png',
          status: TaskStatusEnum.InProgress
        })
      }

      await app.knex('tasks').insert(tasks)

      const res = await app.injectWithLogin('basic@example.com', {
        method: 'GET',
        url: '/api/tasks/download/csv'
      })

      assert.strictEqual(res.statusCode, 200)
      assert.strictEqual(res.headers['content-type'], 'application/gzip')
      assert.strictEqual(
        res.headers['content-disposition'],
        'attachment; filename="tasks.csv.gz"'
      )

      const decompressed = gunzipSync(res.rawPayload).toString('utf-8')
      const lines = decompressed.split('\n')
      assert.equal(lines.length - 1, 1001)

      assert.ok(lines[1].includes('Task 1,1,2,task.png,in-progress'))
      assert.equal(lines[0], 'id,name,author_id,assigned_user_id,filename,status,created_at,updated_at')
    })
  })
})
