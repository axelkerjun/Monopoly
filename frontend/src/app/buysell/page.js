"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BuySellForm from "@/components/BuySellForm";
import Navbar from "@/components/Navbar";

export default function BuySellPage() {
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
          Buy / Sell
        </h1>

        <p className="centerText">
          Logged in as: <strong>{loggedInUser.email}</strong>
        </p>

        <BuySellForm userId={loggedInUser.id} />

      </div>
    </main>
  );
}