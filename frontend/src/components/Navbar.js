"use client";

import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  return (
    <div className="navbar">
      <button
        className="navButton"
        onClick={() => router.push("/dashboard")}
      >
        Dashboard
      </button>

      <button
        className="navButton"
        onClick={() => router.push("/buysell")}
      >
        Buy / Sell
      </button>

      <button
        className="navButton"
        onClick={() => router.push("/transactions")}
      >
        Transactions
      </button>

    </div>
  );
}