import { PageShell } from '@/components/layout/PageShell';
import { TodoList } from '@/components/todo/TodoList';
import { getAllTasks } from '../../../db/queries/tasks';

export default async function TodoPage() {
  const tasks = getAllTasks();
  const open = tasks.filter((t) => t.done === 0);
  const done = tasks.filter((t) => t.done === 1);

  return (
    <PageShell
      eyebrow="Reviewer · Follow-Ups"
      title={<>Your <em className="font-light italic text-[#6b1f2a]">to-do list</em></>}
      masthead={
        <div className="text-right font-mono text-[11px] uppercase tracking-[0.08em] text-[#6b6358] leading-[1.7]">
          <div><span className="text-[#1a1816] font-semibold">{open.length}</span> open tasks</div>
          <div><span className="text-[#1a1816] font-semibold">{done.length}</span> completed</div>
          <div><span className="text-[#1a1816] font-semibold">{tasks.length}</span> all-time</div>
        </div>
      }
    >
      <TodoList tasks={tasks} />
    </PageShell>
  );
}
