"use client";

import { UserContext } from "@/context/user-context";
import { register, registrationAllowed } from "@/shared/api";
import Alert from "@/shared/alert";
import PageTitle from "@/shared/page-title";
import { Button, Field, Input, Skeleton } from "@/shared/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useContext, useEffect, useState } from "react";

export default function Register() {
  const router = useRouter();
  const userContext = useContext(UserContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistrationAllowed, setRegistrationAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    registrationAllowed()
      .then(setRegistrationAllowed)
      .catch(() => setRegistrationAllowed(false));
  }, []);

  useEffect(() => {
    if (!userContext.loading && userContext.loggedIn) {
      router.replace("/");
    }
  }, [userContext.loading, userContext.loggedIn, router]);

  const createAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await register(username, password);

      if (response.ok) {
        setSuccess(true);
        window.setTimeout(() => {
          userContext.reload();
          router.push("/");
        }, 900);
        return;
      }

      setError(
        response.status === 409
          ? "That username is already taken."
          : "Something went wrong. Try again."
      );
    } catch {
      setError("Couldn’t reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isRegistrationAllowed === null) {
    return (
      <main className="mx-auto w-full max-w-[380px] px-4 py-20 sm:py-28">
        <PageTitle title="Create account" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-8 h-10 w-full" />
        <Skeleton className="mt-4 h-10 w-full" />
        <Skeleton className="mt-4 h-9 w-full" />
      </main>
    );
  }

  if (!isRegistrationAllowed) {
    return (
      <main className="mx-auto w-full max-w-[380px] px-4 py-20 sm:py-28">
        <PageTitle title="Registration disabled" />
        <h1 className="text-2xl font-medium tracking-[-0.01em] text-fg">Registration is disabled</h1>
        <p className="mt-2 text-sm text-muted">
          This instance isn’t accepting new accounts. Ask the operator for access.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-fg underline underline-offset-4">
          Back to sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[380px] px-4 py-20 sm:py-28">
      <PageTitle title="Create account" />
      <h1 className="text-2xl font-medium tracking-[-0.01em] text-fg">Create an account</h1>
      <p className="mt-2 text-sm text-muted">Pick a username and password for this instance.</p>

      {success ? (
        <div className="mt-8">
          <Alert type="success" message="Account created. Taking you to your clips…" />
        </div>
      ) : (
        <form onSubmit={createAccount} className="mt-8 space-y-4">
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
            />
          </Field>

          <Field label="Password" htmlFor="password" hint="Use something you don’t reuse elsewhere.">
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
      )}

      {!success && (
        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-fg underline underline-offset-4">
            Sign in
          </Link>
        </p>
      )}
    </main>
  );
}
