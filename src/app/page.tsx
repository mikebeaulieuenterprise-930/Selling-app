import { redirect } from "next/navigation";
import { HOME_PATH } from "@/lib/config";
import { getUser } from "@/lib/auth";

// Le proxy redirige déjà selon la session ; ceci couvre le cas où il ne tourne pas.
export default async function RootPage() {
  const user = await getUser();
  redirect(user ? HOME_PATH : "/login");
}
