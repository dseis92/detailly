"use client";

import { useState, type FormEvent } from "react";

export function SignInForm({ nextPath }: { nextPath: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, nextPath })
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error || "Could not send sign-in email.");
      setMessage(
        "Check your inbox for a secure sign-in link. You can close this page after opening it."
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not send sign-in email."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label htmlFor="account-name">Name</label>
      <input
        id="account-name"
        autoComplete="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Your name"
      />
      <label htmlFor="account-email">Email address</label>
      <input
        id="account-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
      />
      {error && (
        <p className="auth-message auth-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="auth-message" role="status">
          {message}
        </p>
      )}
      <button className="primary-action" disabled={busy}>
        {busy ? "Sending link…" : "Email me a sign-in link"}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
