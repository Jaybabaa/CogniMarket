import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import type { FormEvent } from "react";
import { sql } from "~/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function ensureWaitlistTable() {
  await sql()`create table if not exists waitlist (
    id serial primary key,
    email text unique not null,
    created_at timestamptz not null default now()
  )`;
}

const getWaitlistStatus = createServerFn({ method: "GET" }).handler(async () => {
  if (!process.env.DATABASE_URL) {
    return { available: false as const };
  }
  try {
    await ensureWaitlistTable();
    return { available: true as const };
  } catch {
    return { available: false as const };
  }
});

type JoinResult =
  | { status: "joined" }
  | { status: "duplicate" }
  | { status: "invalid" }
  | { status: "unavailable" }
  | { status: "error" };

const joinWaitlist = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { email: string } }): Promise<JoinResult> => {
    const email = (data?.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return { status: "invalid" };
    }
    if (!process.env.DATABASE_URL) {
      return { status: "unavailable" };
    }
    try {
      await ensureWaitlistTable();
      await sql()`insert into waitlist (email) values (${email})`;
      return { status: "joined" };
    } catch (err) {
      const code =
        typeof err === "object" && err !== null
          ? (err as { code?: unknown }).code
          : undefined;
      if (code === "23505") {
        return { status: "duplicate" };
      }
      return { status: "error" };
    }
  });

export const Route = createFileRoute("/")({
  loader: () => getWaitlistStatus(),
  component: Home,
});

const FEATURES = [
  {
    icon: "✨",
    title: "AI-generated listings",
    body: "Snap a photo or type a one-line prompt and get a complete listing — title, description, and tags — ready to publish.",
  },
  {
    icon: "💲",
    title: "Smart pricing suggestions",
    body: "Price with confidence. CogniMarket suggests a fair price based on comparable listings across the marketplace.",
  },
  {
    icon: "🔎",
    title: "Natural-language search",
    body: "Just ask: “find a MacBook under $600 near me.” AI search understands what you mean and finds the right match.",
  },
  {
    icon: "🎯",
    title: "Personalized recommendations",
    body: "Your feed learns your taste and surfaces items you'll actually love — new, refurbished, and used.",
  },
  {
    icon: "🛡️",
    title: "Fraud and scam detection",
    body: "AI watches for suspicious listings and messages, so every transaction stays safe for buyers and sellers.",
  },
  {
    icon: "💬",
    title: "Secure buyer–seller messaging",
    body: "Chat safely inside the marketplace. Ask questions, agree on details, and buy with confidence.",
  },
];

const SELLER_STEPS = [
  {
    step: "1",
    title: "Snap or describe",
    body: "Take a photo of your item or type a one-line description. That's all it takes to start.",
  },
  {
    step: "2",
    title: "AI builds your listing",
    body: "CogniMarket writes the title, description, and tags — and suggests a fair price from comparable listings.",
  },
  {
    step: "3",
    title: "Publish and chat",
    body: "Go live in seconds, then answer buyers through secure in-app messaging.",
  },
];

const BUYER_STEPS = [
  {
    step: "1",
    title: "Search in plain words",
    body: "Describe what you want — “a sturdy oak desk under $200 nearby” — and let AI do the hunting.",
  },
  {
    step: "2",
    title: "Browse picks for you",
    body: "Get personalized recommendations matched to your taste and budget, protected by fraud detection.",
  },
  {
    step: "3",
    title: "Message and buy",
    body: "Chat securely with the seller, agree on the details, and buy with confidence.",
  },
];

const AUDIENCES = [
  "Individual buyers & sellers",
  "Small & medium businesses",
  "Retail stores",
  "Refurbished-electronics sellers",
  "Auto dealers",
  "Furniture stores",
  "Collectors",
  "Students",
  "Local service providers",
  "Resellers & wholesalers",
];

function Home() {
  const { available } = Route.useLoaderData();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "sending" } | { kind: "done"; result: JoinResult }
  >({ kind: "idle" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (state.kind === "sending") return;
    setState({ kind: "sending" });
    try {
      const result = await joinWaitlist({ data: { email } });
      setState({ kind: "done", result });
    } catch {
      setState({ kind: "done", result: { status: "error" } });
    }
  }

  const done = state.kind === "done" ? state.result : null;

  return (
    <div className="min-h-dvh bg-white text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#top" className="text-xl font-extrabold tracking-tight">
            Cogni<span className="text-indigo-600 dark:text-indigo-400">Market</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 sm:flex dark:text-gray-300">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400">Features</a>
            <a href="#how" className="hover:text-indigo-600 dark:hover:text-indigo-400">How it works</a>
            <a href="#who" className="hover:text-indigo-600 dark:hover:text-indigo-400">Who it&rsquo;s for</a>
          </nav>
          <a
            href="#waitlist"
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Join the waitlist
          </a>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-50 via-white to-white dark:from-indigo-950/40 dark:via-gray-950 dark:to-gray-950" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 text-center sm:pt-24">
          <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            The AI-powered marketplace — launching soon
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            Sell in seconds. <span className="text-indigo-600 dark:text-indigo-400">Buy with confidence.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            CogniMarket is the marketplace for new, refurbished, and used items — where AI writes
            your listings, prices them fairly, and helps every buyer find exactly the right product.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#waitlist"
              className="w-full rounded-full bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-indigo-700 sm:w-auto"
            >
              Join the waitlist
            </a>
            <a
              href="#features"
              className="w-full rounded-full border border-gray-300 px-8 py-3 text-base font-semibold text-gray-700 transition hover:border-indigo-400 hover:text-indigo-600 sm:w-auto dark:border-gray-700 dark:text-gray-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Be first in line when CogniMarket opens its doors.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-16 sm:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to trade smarter</h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600 dark:text-gray-300">
            Six AI-powered essentials — nothing bloated, nothing missing.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="text-3xl" aria-hidden>{f.icon}</div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 bg-gray-50 py-16 sm:py-20 dark:bg-gray-900/50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-600 dark:text-gray-300">
              Listing an item takes seconds. Finding one takes even less.
            </p>
          </div>
          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-xl font-bold">For sellers</h3>
              <ol className="mt-6 space-y-6">
                {SELLER_STEPS.map((s) => (
                  <li key={s.step} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                      {s.step}
                    </span>
                    <div>
                      <p className="font-semibold">{s.title}</p>
                      <p className="mt-1 text-gray-600 dark:text-gray-300">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-xl font-bold">For buyers</h3>
              <ol className="mt-6 space-y-6">
                {BUYER_STEPS.map((s) => (
                  <li key={s.step} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                      {s.step}
                    </span>
                    <div>
                      <p className="font-semibold">{s.title}</p>
                      <p className="mt-1 text-gray-600 dark:text-gray-300">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section id="who" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-16 sm:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Who it&rsquo;s for</h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600 dark:text-gray-300">
            From a student selling a textbook to a dealership moving inventory — CogniMarket fits the way you trade.
          </p>
        </div>
        <ul className="mt-10 flex flex-wrap justify-center gap-3">
          {AUDIENCES.map((a) => (
            <li
              key={a}
              className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200"
            >
              {a}
            </li>
          ))}
        </ul>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="scroll-mt-20 bg-indigo-600 py-16 sm:py-20 dark:bg-indigo-950">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Get early access</h2>
          <p className="mt-3 text-indigo-100">
            Join the waitlist and we&rsquo;ll invite you as soon as CogniMarket launches.
          </p>
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-xl sm:p-8 dark:bg-gray-900">
            {!available ? (
              <div className="py-4">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Our waitlist opens soon
                </p>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  We&rsquo;re putting the finishing touches on signups. Check back shortly to reserve
                  your early-access spot.
                </p>
              </div>
            ) : done?.status === "joined" ? (
              <div className="py-4" role="status">
                <p className="text-2xl" aria-hidden>🎉</p>
                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  You&rsquo;re on the list!
                </p>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Thanks for joining — we&rsquo;ll email you as soon as CogniMarket launches.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
                <label htmlFor="waitlist-email" className="sr-only">Email address</label>
                <input
                  id="waitlist-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={state.kind === "sending"}
                  className="w-full flex-1 rounded-full border border-gray-300 px-5 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-900"
                />
                <button
                  type="submit"
                  disabled={state.kind === "sending"}
                  className="rounded-full bg-indigo-600 px-8 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {state.kind === "sending" ? "Joining…" : "Notify me"}
                </button>
              </form>
            )}
            {available && done && done.status !== "joined" && (
              <p
                className={`mt-4 text-sm font-medium ${
                  done.status === "duplicate"
                    ? "text-indigo-700 dark:text-indigo-300"
                    : "text-red-600 dark:text-red-400"
                }`}
                role="status"
              >
                {done.status === "duplicate" &&
                  "That email is already on the waitlist — you're all set!"}
                {done.status === "invalid" && "Please enter a valid email address."}
                {done.status === "unavailable" &&
                  "Our waitlist opens soon — please check back shortly."}
                {done.status === "error" &&
                  "Something went wrong. Please try again in a moment."}
              </p>
            )}
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              One email when we launch. No spam, ever.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 dark:border-gray-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-gray-500 sm:flex-row dark:text-gray-400">
          <p>
            <span className="font-bold text-gray-700 dark:text-gray-200">CogniMarket</span> — Sell in
            seconds. Buy with confidence.
          </p>
          <p>© 2026 CogniMarket. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
