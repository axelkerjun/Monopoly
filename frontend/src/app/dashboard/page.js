"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CSVuploader from "@/components/CSVuploader";
import SummaryCards from "@/components/SummaryCards";
import Navbar from "@/components/Navbar";
import PortfolioTimeline from "@/components/PortfolioTimeline";
import TickerAutocomplete from "@/components/TickerAutocomplete"; 

export default function DashboardPage() {
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [tradeMessage, setTradeMessage] = useState("");
  const [isTradeError, setIsTradeError] = useState(false);
  const [searchSymbol, setSearchSymbol] = useState(""); // 2. State for tracking global search selection

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

        <div className="field" style={{ margin: "20px auto 30px auto", maxWidth: "500px" }}>
          <label style={{ fontWeight: "700", marginBottom: "6px", display: "block", textAlign: "center" }}>
            Search Markets / View Research
          </label>
          <TickerAutocomplete 
 	    value={searchSymbol} 
 	    onChange={setSearchSymbol} 
  	    onSelect={(result) => {
    	    window.open(`/stocks/${result.tradeSymbol}`, '_blank', 'noopener,noreferrer');
  	    }} 
	  />
	  <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px", textAlign: "center" }}>
            Select an autocomplete result to immediately view detailed charts and analysis metrics.
          </p>
        </div>

        <hr className="hr" />

        <PortfolioTimeline userId={loggedInUser.id} />
        <SummaryCards userId={loggedInUser.id} />

        {tradeMessage && (
          <div className={`message ${isTradeError ? "error" : "success"}`}>
            {tradeMessage}
          </div>
        )}
        
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
