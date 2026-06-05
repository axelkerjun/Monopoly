import React, { useState } from 'react';
import Papa from 'papaparse';

export default function CSVuploader({ userId, setTradeMessage, setIsTradeError }) {
  const [isUploading, setIsUploading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState("");
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setTradeMessage("");
    setIsTradeError(false);
    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedRows = results.data;
        console.log("Starting bulk upload for rows:", parsedRows);

        let successCount = 0;
        let lastLoggedMessage = "";

        try {
          for (let i = 0; i < parsedRows.length; i++) {
            const row = parsedRows[i];
            
            // 1. Sanitize keys
            const cleanRow = {};
            Object.keys(row).forEach(key => {
              if (key) {
                cleanRow[key.trim().toLowerCase()] = row[key] ? row[key].toString().trim() : "";
              }
            });

            const csvTicker = cleanRow['contract code'] || cleanRow['ticker'] || "";
            const csvAction = cleanRow['action'] || cleanRow['type'] || "";
            const csvQuantity = cleanRow['filled qty'] || cleanRow['quantity'] || "0";
            const csvPrice = cleanRow['avg price'] || cleanRow['price'] || "0";
            const csvDate = cleanRow['business date'] || cleanRow['transaction_date'] || cleanRow['date'] || new Date().toISOString().split('T')[0];

            const formattedTransaction = {
              user_id: userId,
              ticker: csvTicker,                    
              type: csvAction,                      
              quantity: parseFloat(csvQuantity),
              price: parseFloat(csvPrice),
              transaction_date: csvDate
            };

            if (!formattedTransaction.ticker || !formattedTransaction.type) {
              console.warn("Skipping empty/corrupt row:", row);
              continue;
            }

            // Update UI progress tracker
            setCurrentProgress(`Processing row ${i + 1} of ${parsedRows.length} (${formattedTransaction.ticker})...`);

            // 2. Send request to backend
            const response = await fetch("/api/transactions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formattedTransaction),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || `Failed to save ${formattedTransaction.ticker}`);
            }

            successCount++;
            lastLoggedMessage = `${data.transaction.type} ${data.transaction.quantity} shares of ${data.transaction.ticker}`;
            
            // Optional: short 100ms artificial delay to prevent slamming the database connection
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // Loop completed perfectly!
          if (successCount > 0) {
            setIsTradeError(false);
            setTradeMessage(`🎉 CSV Bulk Success! Loaded ${successCount} entries. Latest: Logged ${lastLoggedMessage}`);
            e.target.value = "";
	  }

        } catch (err) {
          console.error("Pipeline crashed:", err.message);
          setIsTradeError(true);
          setTradeMessage(`CSV Pipeline Error: ${err.message}`);
        } finally {
          // Always turn off loading screen even if it fails
          setIsUploading(false);
          setCurrentProgress("");
        }
      }
    });
  };

  return (
    <div style={{ padding: '20px', border: '2px dashed #ccc', borderRadius: '8px', textAlign: 'center', margin: '15px 0', backgroundColor: isUploading ? '#f0f7ff' : '#fafafa' }}>
      <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', color: '#333' }}>
        {isUploading ? "Uploading Broker Data..." : "Import Broker Statement (CSV)"}
      </p>
      
      {isUploading ? (
        <div style={{ color: '#0066cc', fontWeight: '500', fontSize: '14px' }}>
          ⏳ {currentProgress}
        </div>
      ) : (
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload} 
          style={{ cursor: 'pointer', fontSize: '14px' }}
        />
      )}
    </div>
  );
}
