import { before, describe, it } from 'node:test'
import assert from 'node:assert'
import { build } from '../../../helper.js'
import { Task, TaskStatusEnum, TaskPaginationResultSchema } from '../../../../src/schemas/tasks.js'
import { FastifyInstance } from 'fastify'
import { Static } from '@sinclair/typebox'

async function createUser (app: FastifyInstance, userData: Partial<{ username: string; password: string }>) {
  const [id] = await app.knex('users').insert(userData)
  return id
}

async function createTask (app: FastifyInstance, taskData: Partial<Task>) {
  const [id] = await app.knex<Task>('tasks').insert(taskData)

  return id
}

describe('Tasks api (logged user only)', () => {
  describe('GET /api/tasks', () => {
    let app: FastifyInstance
    let userId1: number
    let userId2: number

    let firstTaskId: number

    before(async () => {
      app = await build()

      userId1 = await createUser(app, { username: 'user1', password: 'password1' })
      userId2 = await createUser(app, { username: 'user2', password: 'password2' })

      firstTaskId = await createTask(app, { name: 'Task 1', author_id: userId1, status: TaskStatusEnum.New })
      await createTask(app, { name: 'Task 2', author_id: userId1, assigned_user_id: userId2, status: TaskStatusEnum.InProgress })
      await createTask(app, { name: 'Task 3', author_id: userId2, status: TaskStatusEnum.Completed })
      await createTask(app, { name: 'Task 4', author_id: userId1, assigned_user_id: userId1, status: TaskStatusEnum.OnHold })

      app.close()
    })

    it('should return a list of tasks with no pagination filter', async (t) => {
      app = await build(t)

      const res = await app.injectWithLogin('basic', {
        method: 'GET',
        url: '/api/tasks'
      })

      assert.strictEqual(res.statusCode, 200)
      const { tasks, total } = JSON.parse(res.payload) as Static<typeof TaskPaginationResultSchema>
      const firstTask = tasks.find((task) => task.id === firstTaskId)

      assert.ok(firstTask, 'Created task should be in the response')
      assert.deepStrictEqual(firstTask.name, 'Task 1')
      assert.strictEqual(firstTask.author_id, userId1)
      assert.strictEqual(firstTask.status, TaskStatusEnum.New)

      assert.strictEqual(total, 4)
    })

    it('should paginate by page and limit', async (t) => {
      app = await build(t)
      const res = await app.injectWithLogin('basic', {
        method: 'GET',
        url: '/api/tasks',
        query: { page: '2', limit: '1' }
      })

      assert.strictEqual(res.statusCode, 200)
      const { tasks, total } = JSON.parse(res.payload) as Static<typeof TaskPaginationResultSchema>

      assert.strictEqual(total, 4)
      assert.strictEqual(tasks.length, 1)
      assert.strictEqual(tasks[0].name, 'Task 2')
      assert.strictEqual(tasks[0].author_id, userId1)
      assert.strictEqual(tasks[0].status, TaskStatusEnum.InProgress)
    })

    it('should filter tasks by assigned_user_id', async (t) => {
      app = await build(t)

      const res = await app.injectWithLogin('basic', {
        method: 'GET',
        url: '/api/tasks',
        query: { assigned_user_id: userId2.toString() }
      })

      assert.strictEqual(res.statusCode, 200)
      const { tasks, total } = JSON.parse(res.payload) as Static<typeof TaskPaginationResultSchema>

      assert.strictEqual(total, 1)
      tasks.forEach(task => assert.strictEqual(task.assigned_user_id, userId2))
    })

    it('should filter tasks by status', async (t) => {
      app = await build(t)
      const res = await app.injectWithLogin('basic', {
        method: 'GET',
        url: '/api/tasks',
        query: { status: TaskStatusEnum.Completed }
      })

      assert.strictEqual(res.statusCode, 200)
      const { tasks, total } = JSON.parse(res.payload) as Static<typeof TaskPaginationResultSchema>

      assert.strictEqual(total, 1)
      tasks.forEach(task => assert.strictEqual(task.status, TaskStatusEnum.Completed))
    })

    it('should paginate and filter tasks by author_id and status', async (t) => {
      app = await build(t)
      const res = await app.injectWithLogin('basic', {
        method: 'GET',
        url: '/api/tasks',
        query: { author_id: userId1.toString(), status: TaskStatusEnum.OnHold, page: '1', limit: '1' }
      })

      assert.strictEqual(res.statusCode, 200)
      const { tasks, total } = JSON.parse(res.payload) as Static<typeof TaskPaginationResultSchema>

      assert.strictEqual(total, 1)
      assert.strictEqual(tasks.length, 1)
      assert.strictEqual(tasks[0].name, 'Task 4')
      assert.strictEqual(tasks[0].author_id, userId1)
      assert.strictEqual(tasks[0].status, TaskStatusEnum.OnHold)
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

      const res = await app.injectWithLogin('basic', {
        method: 'GET',
        url: `/api/tasks/${newTaskId}`
      })

      assert.strictEqual(res.statusCode, 200)
      const task = JSON.parse(res.payload) as Task
      assert.equal(task.id, newTaskId)
    })

    it('should return 404 if task is not found', async (t) => {
      const app = await build(t)

      const res = await app.injectWithLogin('basic', {
        method: 'GET',
        url: '/api/tasks/9999'
      })

      assert.strictEqual(res.statusCode, 404)
      const payload = JSON.parse(res.payload)
      assert.strictEqual(payload.message, 'Task not found')
    })
  })

  describe('POST /api/tasks', () => {
    it('should create a new task', async (t) => {
      const app = await build(t)

      const taskData = {
        name: 'New Task',
        author_id: 1
      }

      const res = await app.injectWithLogin('basic', {
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

      const res = await app.injectWithLogin('basic', {
        method: 'PATCH',
        url: `/api/tasks/${newTaskId}`,
        payload: updatedData
      })

      assert.strictEqual(res.statusCode, 200)
      const updatedTask = await app.knex<Task>('tasks').where({ id: newTaskId }).first()
      assert.equal(updatedTask?.name, updatedData.name)
    })

    it('should return 404 if task is not found for update', async (t) => {
      const app = await build(t)

      const updatedData = {
        name: 'Updated Task'
      }

      const res = await app.injectWithLogin('basic', {
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

      const res = await app.injectWithLogin('admin', {
        method: 'DELETE',
        url: `/api/tasks/${newTaskId}`
      })

      assert.strictEqual(res.statusCode, 204)

      const deletedTask = await app.knex<Task>('tasks').where({ id: newTaskId }).first()
      assert.strictEqual(deletedTask, undefined)
    })

    it('should return 404 if task is not found for deletion', async (t) => {
      const app = await build(t)

      const res = await app.injectWithLogin('admin', {
        method: 'DELETE',
        url: '/api/tasks/9999'
      })

      assert.strictEqual(res.statusCode, 404)
      const payload = JSON.parse(res.payload)
      assert.strictEqual(payload.message, 'Task not found')
    })
  })

  describe('POST /api/tasks/:id/assign', () => {
    it('should assign a task to a user and persist the changes', async (t) => {
      const app = await build(t)

      for (const username of ['moderator', 'admin']) {
        const taskData = {
          name: 'Task to Assign',
          author_id: 1,
          status: TaskStatusEnum.New
        }
        const newTaskId = await createTask(app, taskData)

        const res = await app.injectWithLogin(username, {
          method: 'POST',
          url: `/api/tasks/${newTaskId}/assign`,
          payload: {
            userId: 2
          }
        })

        assert.strictEqual(res.statusCode, 200)

        const updatedTask = await app.knex<Task>('tasks').where({ id: newTaskId }).first()
        assert.strictEqual(updatedTask?.assigned_user_id, 2)
      }
    })

    it('should unassign a task from a user and persist the changes', async (t) => {
      const app = await build(t)

      for (const username of ['moderator', 'admin']) {
        const taskData = {
          name: 'Task to Unassign',
          author_id: 1,
          assigned_user_id: 2,
          status: TaskStatusEnum.New
        }
        const newTaskId = await createTask(app, taskData)

        const res = await app.injectWithLogin(username, {
          method: 'POST',
          url: `/api/tasks/${newTaskId}/assign`,
          payload: {}
        })

        assert.strictEqual(res.statusCode, 200)

        const updatedTask = await app.knex<Task>('tasks').where({ id: newTaskId }).first()
        assert.strictEqual(updatedTask?.assigned_user_id, null)
      }
    })

    it('should return 403 if not a moderator', async (t) => {
      const app = await build(t)

      const res = await app.injectWithLogin('basic', {
        method: 'POST',
        url: '/api/tasks/1/assign',
        payload: {}
      })

      assert.strictEqual(res.statusCode, 403)
    })

    it('should return 404 if task is not found', async (t) => {
      const app = await build(t)

      const res = await app.injectWithLogin('moderator', {
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
})
