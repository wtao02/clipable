"use client";

import { UserContext } from "@/context/user-context";
import { login, registrationAllowed, setupStatus } from "@/shared/api";
import Alert from "@/shared/alert";
import PageTitle from "@/shared/page-title";
import { Button, Field, Input } from "@/shared/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useContext, useEffect, useState } from "react";

export default function Login() {
  const router = useRouter();
  const userContext = useContext(UserContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistrationAllowed, setRegistrationAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    registrationAllowed()
      .then(setRegistrationAllowed)
      .catch(() => setRegistrationAllowed(false));
  }, []);

  useEffect(() => {
    setupStatus()
      .then((needsSetup) => {
        if (needsSetup) router.replace("/setup");
      })
      .catch(() => undefined);
  }, [router]);

  useEffect(() => {
    if (!userContext.loading && userContext.loggedIn) {
      router.replace("/");
    }
  }, [userContext.loading, userContext.loggedIn, router]);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const ok = await login(username, password);
      if (ok) {
        userContext.reload();
        router.push("/");
        return;
      }

      setError("That username and password don’t match.");
    } catch {
      setError("Couldn’t reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[380px] px-4 py-20 sm:py-28">
      <PageTitle title="Sign in" />
      <h1 className="text-2xl font-medium tracking-[-0.01em] text-fg">Sign in</h1>
      <p className="mt-2 text-sm text-muted">Use your Vitryne account to upload and manage clips.</p>

      <form onSubmit={signIn} className="mt-8 space-y-4">
        <Field label="Username" htmlFor="username">
          <Input
            id="username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>

        {error && <Alert type="error" message={error} />}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {isRegistrationAllowed && (
        <p className="mt-6 text-sm text-muted">
          No account?{" "}
          <Link href="/register" className="text-fg underline underline-offset-4">
            Create one
          </Link>
        </p>
      )}
    </main>
  );
}
