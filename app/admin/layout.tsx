import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/app/lib/dal";
import { AdminTabs } from "./admin-tabs";

// Checagem de admin no servidor — nunca confia em nada vindo do cliente
// (nem que o link só apareça pra admin na tela inicial).
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Admin</p>
        <Link
          href="/"
          className="flex h-9 items-center rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          ← Calendário
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4">
        <AdminTabs />
        {children}
      </main>
    </div>
  );
}
