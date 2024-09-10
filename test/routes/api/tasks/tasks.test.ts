import { describe, it } from "node:test";
import assert from "node:assert";
import { build } from "../../../helper.js";
import { Task, TaskStatus } from "../../../../src/schemas/tasks.js";
import { FastifyInstance } from "fastify";

async function createTask(app: FastifyInstance, taskData: Partial<Task>) {
  return await app.repository.create("tasks", { data: taskData });
}

describe('Tasks api (logged user only)', () => {
  describe('GET /api/tasks', () => {
    it("should return a list of tasks", async (t) => {
      const app = await build(t);
    
      const taskData = {
        name: "New Task",
        author_id: 1,
        status: TaskStatus.New
      };
    
      const newTaskId = await app.repository.create("tasks", { data: taskData });
    
      const res = await app.injectWithLogin("basic", {
        method: "GET",
        url: "/api/tasks"
      });
    
      assert.strictEqual(res.statusCode, 200);
      const tasks = JSON.parse(res.payload) as Task[];
      const createdTask = tasks.find((task) => task.id === newTaskId);
      assert.ok(createdTask, "Created task should be in the response");
    
      assert.deepStrictEqual(taskData.name, createdTask.name);
      assert.strictEqual(taskData.author_id, createdTask.author_id);
      assert.strictEqual(taskData.status, createdTask.status);
    });
  })

  describe('GET /api/tasks/:id', () => {
    it("should return a task", async (t) => {
      const app = await build(t);
  
      const taskData = {
        name: "Single Task",
        author_id: 1,
        status: TaskStatus.New
      };
      
      const newTaskId = await createTask(app, taskData);
  
      const res = await app.injectWithLogin("basic", {
        method: "GET",
        url: `/api/tasks/${newTaskId}`
      });
  
      assert.strictEqual(res.statusCode, 200);
      const task = JSON.parse(res.payload) as Task;
      assert.equal(task.id, newTaskId);
    });
  
    it("should return 404 if task is not found", async (t) => {
      const app = await build(t);
  
      const res = await app.injectWithLogin("basic", {
        method: "GET",
        url: "/api/tasks/9999" 
      });
  
      assert.strictEqual(res.statusCode, 404);
      const payload = JSON.parse(res.payload);
      assert.strictEqual(payload.message, "Task not found");
    });
  });

  describe('POST /api/tasks', () => {
    it("should create a new task", async (t) => {
      const app = await build(t);

      const taskData = {
        name: "New Task",
        author_id: 1
      };

      const res = await app.injectWithLogin("basic", {
        method: "POST",
        url: "/api/tasks",
        payload: taskData
      });

      assert.strictEqual(res.statusCode, 201);
      const { id } = JSON.parse(res.payload);

      const createdTask = await app.repository.find<Task>("tasks", { select: 'name', where: { id } }) as Task;
      assert.equal(createdTask.name, taskData.name);
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it("should update an existing task", async (t) => {
      const app = await build(t);

      const taskData = {
        name: "Task to Update",
        author_id: 1,
        status: TaskStatus.New
      };
      const newTaskId = await createTask(app, taskData);

      const updatedData = {
        name: "Updated Task"
      };

      const res = await app.injectWithLogin("basic", {
        method: "PATCH",
        url: `/api/tasks/${newTaskId}`,
        payload: updatedData
      });

      assert.strictEqual(res.statusCode, 200);
      const updatedTask = await app.repository.find<Task>("tasks", { where: { id: newTaskId } }) as Task;
      assert.equal(updatedTask.name, updatedData.name);
    });

    it("should return 404 if task is not found for update", async (t) => {
      const app = await build(t);

      const updatedData = {
        name: "Updated Task"
      };

      const res = await app.injectWithLogin("basic", {
        method: "PATCH",
        url: "/api/tasks/9999",
        payload: updatedData
      });

      assert.strictEqual(res.statusCode, 404);
      const payload = JSON.parse(res.payload);
      assert.strictEqual(payload.message, "Task not found");
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it("should delete an existing task", async (t) => {
      const app = await build(t);

      const taskData = {
        name: "Task to Delete",
        author_id: 1,
        status: TaskStatus.New
      };
      const newTaskId = await createTask(app, taskData);

      const res = await app.injectWithLogin("basic", {
        method: "DELETE",
        url: `/api/tasks/${newTaskId}`
      });

      assert.strictEqual(res.statusCode, 204);

      const deletedTask = await app.repository.find<Task>("tasks", { where: { id: newTaskId } });
      assert.strictEqual(deletedTask, null);
    });

    it("should return 404 if task is not found for deletion", async (t) => {
      const app = await build(t);

      const res = await app.injectWithLogin("basic", {
        method: "DELETE",
        url: "/api/tasks/9999"
      });

      assert.strictEqual(res.statusCode, 404);
      const payload = JSON.parse(res.payload);
      assert.strictEqual(payload.message, "Task not found");
    });
  });
})
