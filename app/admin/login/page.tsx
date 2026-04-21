import { redirect } from "next/navigation";

import { getAuthedAdminEmail } from "@/lib/admin/auth";

import { LoginForm } from "./_form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const email = await getAuthedAdminEmail();
  if (email) {
    redirect("/admin");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-20 font-mono">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Admin sign-in</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Magic-link only. Your email must be on the admin allowlist.
        </p>
      </header>
      <LoginForm />
    </main>
  );
}
