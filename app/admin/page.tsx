import { redirect } from "next/navigation";

import { getAuthedAdminEmail } from "@/lib/admin/auth";

import { fetchAdminOverview, signOutAdminAction } from "./actions";
import { IssueCodesCard } from "./_components/issue-codes-card";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const email = await getAuthedAdminEmail();
  if (!email) {
    redirect("/admin/login");
  }

  const overview = await fetchAdminOverview();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10 font-mono">
      <header className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="text-xs text-neutral-500">signed in as {email}</p>
        </div>
        <form action={signOutAdminAction}>
          <button
            type="submit"
            className="text-xs underline underline-offset-2 text-neutral-600 dark:text-neutral-300"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Signups" value={overview.totals.signups} />
        <Stat label="Invite codes issued" value={overview.totals.codes} />
        <Stat label="Redemptions" value={overview.totals.redemptions} />
      </section>

      <IssueCodesCard />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Recent invite codes
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="py-2 pr-4">Code</th>
                <th className="py-2 pr-4">Remaining</th>
                <th className="py-2 pr-4">Allowed</th>
                <th className="py-2 pr-4">Note</th>
                <th className="py-2">Issued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {overview.recentCodes.map((row) => (
                <tr key={row.code}>
                  <td className="py-2 pr-4 font-mono">{row.code}</td>
                  <td className="py-2 pr-4">{row.usesRemaining}</td>
                  <td className="py-2 pr-4">{row.usesAllowed}</td>
                  <td className="py-2 pr-4 text-neutral-500">
                    {row.note ?? "—"}
                  </td>
                  <td className="py-2 text-xs text-neutral-500">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {overview.recentCodes.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-xs text-neutral-500"
                  >
                    No codes yet. Issue a batch above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Waitlist signups (latest 100)
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {overview.signups.map((row) => (
                <tr key={row.email}>
                  <td className="py-2 pr-4">{row.email}</td>
                  <td className="py-2 pr-4 text-neutral-500">
                    {row.source ?? "—"}
                  </td>
                  <td className="py-2 text-xs text-neutral-500">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {overview.signups.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="py-6 text-center text-xs text-neutral-500"
                  >
                    No signups yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
      <span className="text-xs uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <span className="text-2xl font-semibold">{value}</span>
    </div>
  );
}
