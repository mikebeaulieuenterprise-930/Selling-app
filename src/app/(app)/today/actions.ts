"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { setTaskDone } from "@/lib/data/tasks";

export async function toggleTaskAction(id: string, done: boolean): Promise<void> {
  await requireUser();
  await setTaskDone(id, done);
  revalidatePath("/today");
}
