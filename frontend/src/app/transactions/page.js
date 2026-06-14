"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TransactionsTable from "@/components/TransactionsTable";
import Navbar from "@/components/Navbar";

export default function TransactionsPage() {
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");

    if (!storedUser) {
      router.push("/");
      return;
    }

    setLoggedInUser(JSON.parse(storedUser));
  }, [router]);

  if (!loggedInUser) return null;

  return (
    <main className="pageWide">
      <div className="cardWide">

        <Navbar />

        <h1 className="dashboardTitle">
          Transactions
        </h1>

        <TransactionsTable userId={loggedInUser.id} />

      </div>
    </main>
  );
}