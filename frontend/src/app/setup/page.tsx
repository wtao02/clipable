"use client";

import { UserContext } from "@/context/user-context";
import { createOwner, setupStatus } from "@/shared/api";
import Alert from "@/shared/alert";
import PageTitle from "@/shared/page-title";
import { Button, Field, Input } from "@/shared/ui";
import { useRouter } from "next/navigation";
import { FormEvent, useContext, useEffect, useState } from "react";

export default function Setup() {
  const router = useRouter();
  const userContext = useContext(UserContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setupStatus()
      .then((needsSetup) => {
        if (!needsSetup) {
          router.replace("/login");
          return;
        }

        setChecking(false);
      })
      .catch(() => {
        setError("Couldn’t reach the server. Try again.");
        setChecking(false);
      });
  }, [router]);

  useEffect(() => {
    if (!checking && !userContext.loading && userContext.loggedIn) {
      router.replace("/");
    }
  }, [checking, router, userContext.loading, userContext.loggedIn]);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await createOwner(username, password);

      if (response.status === 409) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const message = await response.text();
        setError(message || "Couldn’t create the account.");
        return;
      }

      userContext.reload();
      router.push("/");
    } catch {
      setError("Couldn’t reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <main className="mx-auto w-full max-w-[380px] px-4 py-20 sm:py-28">
        <PageTitle title="Set up" />
        <div className="h-6 w-32 animate-pulse rounded bg-surface-2" />
        <div className="mt-8 space-y-4">
          <div className="h-10 animate-pulse rounded-md bg-surface-2" />
          <div className="h-10 animate-pulse rounded-md bg-surface-2" />
          <div className="h-9 animate-pulse rounded-md bg-surface-2" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[380px] px-4 py-20 sm:py-28">
      <PageTitle title="Set up" />
      <h1 className="text-2xl font-medium tracking-[-0.01em] text-fg">Create the owner account</h1>
      <p className="mt-2 text-sm text-muted">
        This is the first account on this instance. It owns the library; you can invite or allow
        other accounts later.
      </p>

      <form onSubmit={create} className="mt-8 space-y-4">
        <Field label="Username" htmlFor="username">
          <Input
            id="username"
            name="username"
            autoComplete="username"
            minLength={2}
            maxLength={64}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            autoFocus
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={2}
            maxLength={256}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>

        {error && <Alert type="error" message={error} />}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </main>
  );
}
