"use client";

import { Eye, EyeOff, Landmark, PiggyBank } from "lucide-react";
import { useState } from "react";

type BalanceRow = {
  label: string;
  amount: string;
  date: string;
  icon: "savings" | "share_capital";
};

type BalanceHeroProps = {
  rows: BalanceRow[];
};

const iconMap = {
  savings: PiggyBank,
  share_capital: Landmark
};

export function BalanceHero({ rows }: BalanceHeroProps) {
  const [hidden, setHidden] = useState(false);

  return (
    <section className="rounded-2xl bg-gradient-to-br from-[#10233f] to-[#136f63] p-6 text-white sm:p-8">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
            Member Portal
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Welcome back!</h1>
          <p className="mt-1 text-sm text-white/70">
            Here&apos;s an overview of your BMPC account services.
          </p>
        </div>

        {/* Hide/show toggle */}
        <button
          onClick={() => setHidden((v) => !v)}
          className="mt-1 flex shrink-0 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/20"
          aria-label={hidden ? "Show balances" : "Hide balances"}
        >
          {hidden ? <Eye size={13} /> : <EyeOff size={13} />}
          {hidden ? "Show" : "Hide"}
        </button>
      </div>

      {/* Balance cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {rows.map((row) => {
          const Icon = iconMap[row.icon];
          return (
            <div
              key={row.icon}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm"
            >
              <div>
                <p className="text-xs font-medium text-white/60">{row.label}</p>
                <p className="mt-1 text-xl font-bold tracking-wide text-white">
                  {hidden ? "••••••" : row.amount}
                </p>
                <p className="mt-0.5 text-xs text-white/50">
                  {hidden ? "Balance hidden" : row.date}
                </p>
              </div>
              <div className="grid size-10 place-items-center rounded-xl bg-white/10 text-white/80">
                <Icon aria-hidden size={20} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
