"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/client";
import { Card } from "@/components/ui";
import { IconCheck, IconChevronRight } from "@/components/icons";
import { toggleTaskAction } from "./actions";

export type TaskItem = {
  id: string;
  title: string;
  detail: string | null;
  minutes: number;
  href: string;
  done: boolean;
};

export function TaskList({ tasks }: { tasks: TaskItem[] }) {
  const { t } = useI18n();
  const [doneById, setDoneById] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tasks.map((task) => [task.id, task.done])),
  );
  const [, startTransition] = useTransition();

  function toggle(task: TaskItem) {
    const next = !(doneById[task.id] ?? task.done);
    setDoneById((m) => ({ ...m, [task.id]: next }));
    startTransition(async () => {
      try {
        await toggleTaskAction(task.id, next);
      } catch {
        setDoneById((m) => ({ ...m, [task.id]: !next }));
      }
    });
  }

  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => {
        const done = doneById[task.id] ?? task.done;
        return (
          <Card as="li" key={task.id} className={`flex items-center gap-3 p-3 ${done ? "opacity-60" : ""}`}>
            <button
              type="button"
              role="checkbox"
              aria-checked={done}
              aria-label={task.title}
              onClick={() => toggle(task)}
              className={`flex size-7 shrink-0 items-center justify-center rounded-lg border-2 transition ${
                done ? "border-good bg-good text-white" : "border-line bg-surface"
              }`}
            >
              {done ? <IconCheck size={16} strokeWidth={2.6} /> : null}
            </button>
            <Link href={task.href} className="flex min-w-0 flex-1 items-center gap-2">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className={`truncate text-[15px] font-medium ${done ? "line-through" : ""}`}>{task.title}</span>
                {task.detail ? <span className="truncate text-xs text-muted">{task.detail}</span> : null}
              </span>
              <span className="shrink-0 text-xs font-medium text-muted tabular-nums">
                {task.minutes} {t.common.minutes}
              </span>
              <IconChevronRight size={16} className="shrink-0 text-muted" />
            </Link>
          </Card>
        );
      })}
    </ul>
  );
}
