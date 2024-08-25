import fp from 'fastify-plugin';
import { MultiOriginTransition, Transition, Workflow } from '@jean-michelet/workflow';
import { Task, TaskStatus, TaskTransitions } from '../../schemas/tasks.js';

declare module "fastify" {
    export interface FastifyInstance {
      taskWorkflow: ReturnType<typeof createTaskWorkflow>;
    }
  }

function createTaskWorkflow() {
    const wf = new Workflow<Task>({
        stateProperty: 'status'
    })
    
    wf.addTransition(TaskTransitions.Start, new Transition(TaskStatus.New, TaskStatus.InProgress));
    wf.addTransition(TaskTransitions.Complete, new Transition(TaskStatus.InProgress, TaskStatus.Completed));
    wf.addTransition(TaskTransitions.Hold, new Transition(TaskStatus.InProgress, TaskStatus.OnHold));
    wf.addTransition(TaskTransitions.Resume, new Transition(TaskStatus.OnHold, TaskStatus.InProgress));
    wf.addTransition(TaskTransitions.Cancel, new MultiOriginTransition(
      [TaskStatus.New, TaskStatus.InProgress, TaskStatus.OnHold],
      TaskStatus.Canceled
    ));
    wf.addTransition(TaskTransitions.Archive, new Transition(TaskStatus.Completed, TaskStatus.Archived));
    
    return wf
}

export default fp(async (fastify) => {
  fastify.decorate('taskWorkflow', createTaskWorkflow());
}, {
  name: 'workflow'
});
