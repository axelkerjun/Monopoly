"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    const endpoint = isLoginMode
      ? `/api/auth/login`
      : `/api/auth/register`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (isLoginMode) {
        localStorage.setItem("loggedInUser", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        setMessage("Success! Account created. You can now log in.");
        setEmail("");
        setPassword("");
        setIsLoginMode(true);
      }
    } catch (err) {
      setIsError(true);
      setMessage(err.message || "Authentication failed");
    }
  };

  return (
    <main className="page">
      <div className="card">
        <h1 className="title">Monopoly</h1>
        <p className="subtitle">Track your stock portfolio in one place.</p>

        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="button" type="submit">
            {isLoginMode ? "Sign In" : "Register"}
          </button>
        </form>

        <button
          className="linkButton"
          onClick={() => {
            setIsLoginMode(!isLoginMode);
            setMessage("");
            setIsError(false);
          }}
        >
          {isLoginMode
            ? "Don't have an account? Sign up"
            : "Already have an account? Log in"}
        </button>

        {message && (
          <div className={`message ${isError ? "error" : "success"}`}>
            {message}
          </div>
        )}
      </div>
    </main>
  );
}
