import Fastify, { FastifyInstance } from "fastify";
import { Task, TaskStatus, TaskTransitions } from "../../src/schemas/tasks.js";
import workflowPlugin from "../../src/plugins/custom/workflow.js";
import assert from "assert";
import { after, before, describe, it } from "node:test";

describe("workflow", () => {
  let app: FastifyInstance;

  before(async () => {
    app = Fastify();
    app.register(workflowPlugin);

    await app.ready()
  });

  after(() => app.close());

  it("Start transition", async () => {
    const task = { status: TaskStatus.New } as Task;
    assert.ok(app.taskWorkflow.can(TaskTransitions.Start, task));
    assert.ok(app.taskWorkflow.can(TaskTransitions.Cancel, task));

    assert.ok(!app.taskWorkflow.can(TaskTransitions.Complete, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Hold, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Resume, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Archive, task));
  });

  it("In Progress transitions", async () => {
    const task = { status: TaskStatus.InProgress } as Task;
    assert.ok(app.taskWorkflow.can(TaskTransitions.Complete, task));
    assert.ok(app.taskWorkflow.can(TaskTransitions.Hold, task));
    assert.ok(app.taskWorkflow.can(TaskTransitions.Cancel, task));

    assert.ok(!app.taskWorkflow.can(TaskTransitions.Start, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Resume, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Archive, task));
  });

  it("On Hold transitions", async () => {

    const task = { status: TaskStatus.OnHold } as Task;
    assert.ok(app.taskWorkflow.can(TaskTransitions.Resume, task));
    assert.ok(app.taskWorkflow.can(TaskTransitions.Cancel, task));

    assert.ok(!app.taskWorkflow.can(TaskTransitions.Start, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Complete, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Hold, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Archive, task));
  });

  it("Completed transitions", async () => {

    const task = { status: TaskStatus.Completed } as Task;
    assert.ok(app.taskWorkflow.can(TaskTransitions.Archive, task));

    assert.ok(!app.taskWorkflow.can(TaskTransitions.Start, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Complete, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Hold, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Resume, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Cancel, task));
  });

  it("Canceled transitions", async () => {

    const task = { status: TaskStatus.Canceled } as Task;

    assert.ok(!app.taskWorkflow.can(TaskTransitions.Start, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Complete, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Hold, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Resume, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Archive, task));
  });

  it("Archived transitions", async () => {

    const task = { status: TaskStatus.Archived } as Task;

    assert.ok(!app.taskWorkflow.can(TaskTransitions.Start, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Complete, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Hold, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Resume, task));
    assert.ok(!app.taskWorkflow.can(TaskTransitions.Cancel, task));
  });
});
