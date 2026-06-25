"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CSVuploader from "@/components/CSVuploader";
import SummaryCards from "@/components/SummaryCards";
import Navbar from "@/components/Navbar";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function DashboardPage() {
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [tradeMessage, setTradeMessage] = useState("");
  const [isTradeError, setIsTradeError] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");

    if (!storedUser) {
      router.push("/");
      return;
    }

    setLoggedInUser(JSON.parse(storedUser));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    router.push("/");
  };

  if (!loggedInUser) return null;

  return (
    <main className="pageWide">
      <div className="cardWide">
        <Navbar />

        <h1 className="dashboardTitle">Monopoly Dashboard</h1>

        <p className="centerText">
          Logged in as: <strong>{loggedInUser.email}</strong>
        </p>

        <hr className="hr" />

        {tradeMessage && (
          <div className={`message ${isTradeError ? "error" : "success"}`}>
            {tradeMessage}
          </div>
        )}

        <SummaryCards userId={loggedInUser.id} />

        <CSVuploader
          userId={loggedInUser.id}
          setTradeMessage={setTradeMessage}
          setIsTradeError={setIsTradeError}
        />

        <button className="logoutButton" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </main>
  );
}