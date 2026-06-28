import React, { useState } from 'react';
import Papa from 'papaparse';

export default function CSVuploader({ userId, setTradeMessage, setIsTradeError }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [currentProgress, setCurrentProgress] = useState("");

  // Master execution loop shared by both click-uploads and drop-uploads
  const processFilePipeline = (file) => {
    if (!file) {
      setIsTradeError(true);
      setTradeMessage("No file detected. Please choose a valid CSV file.");
      return;
    }

    setTradeMessage("");
    setIsTradeError(false);
    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      error: (parseError) => {
        console.error("PapaParse native error:", parseError);
        setIsTradeError(true);
        setTradeMessage(`File Reading Error: ${parseError.message}`);
        setIsUploading(false);
      },
      complete: async (results) => {
        const parsedRows = results.data;
        if (!parsedRows || parsedRows.length === 0) {
          setIsTradeError(true);
          setTradeMessage("Upload failed: The uploaded file appears to be empty.");
          setIsUploading(false);
          return;
        }

        let successCount = 0;
        let lastLoggedMessage = "";

        try {
          for (let i = 0; i < parsedRows.length; i++) {
            const row = parsedRows[i];
            const cleanRow = {};
            Object.keys(row).forEach(key => {
              if (key) cleanRow[key.trim().toLowerCase()] = row[key] ? row[key].toString().trim() : "";
            });

            const csvTicker = cleanRow['contract code'] || cleanRow['ticker'] || "";
            const csvAction = cleanRow['action'] || cleanRow['type'] || "";
            const csvQuantity = cleanRow['filled qty'] || cleanRow['quantity'] || "0";
            const csvPrice = cleanRow['avg price'] || cleanRow['price'] || "0";
            const csvDate = cleanRow['business date'] || cleanRow['transaction_date'] || cleanRow['date'] || new Date().toISOString().split('T')[0];

            if (!csvTicker || !csvAction) continue;

            const finalQuantity = parseFloat(csvQuantity);
            const finalPrice = parseFloat(csvPrice);

            if (isNaN(finalQuantity) || isNaN(finalPrice) || finalQuantity <= 0 || finalPrice < 0) continue;

            const formattedTransaction = {
              user_id: userId,
              ticker: csvTicker.toUpperCase(),                    
              type: csvAction.toUpperCase(),                      
              quantity: finalQuantity,
              price: finalPrice,
              transaction_date: csvDate
            };

            setCurrentProgress(`Processing row ${i + 1} of ${parsedRows.length} (${formattedTransaction.ticker})...`);

            try {
              const response = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formattedTransaction),
              });

              const data = await response.json();
              if (!response.ok) throw new Error(data.error || "Server rejection");

              successCount++;
              lastLoggedMessage = `${formattedTransaction.type} ${formattedTransaction.quantity} shares of ${formattedTransaction.ticker}`;
              await new Promise(resolve => setTimeout(resolve, 80));

            } catch (rowError) {
              console.error(`DB error on row ${i + 1}:`, rowError.message);
              setIsTradeError(true);
              setTradeMessage(`Error saving ${formattedTransaction.ticker}: ${rowError.message}`);
            }
          }

          if (successCount > 0) {
            setIsTradeError(false);
            setTradeMessage(`CSV Bulk Success! Loaded ${successCount} entries. Latest: ${lastLoggedMessage}`);
          } else {
            setIsTradeError(true);
            setTradeMessage("Upload processed: No valid or new transactions could be synchronized.");
          }

        } catch (pipelineFatalError) {
          console.error(pipelineFatalError);
          setIsTradeError(true);
          setTradeMessage(`Critical upload error: ${pipelineFatalError.message}`);
        } finally {
          setIsUploading(false);
          setCurrentProgress("");
        }
      }
    });
  };

  // Drag and Drop Browser Window Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFilePipeline(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFilePipeline(e.target.files[0]);
      e.target.value = ""; // Clear file selector string
    }
  };

  // Dynamic style engine depending on upload states
  const getContainerStyle = () => {
    const baseStyle = {
      padding: '40px 20px',
      border: '2px dashed #b5b5b5',
      borderRadius: '12px',
      textAlign: 'center',
      margin: '20px 0',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      backgroundColor: '#fafafa',
      position: 'relative'
    };

    if (isDragActive) {
      return { ...baseStyle, border: '2px solid #0066cc', backgroundColor: '#e6f2ff' };
    }
    if (isUploading) {
      return { ...baseStyle, border: '2px dashed #0066cc', backgroundColor: '#f0f7ff', cursor: 'wait' };
    }
    return baseStyle;
  };

  return (
    <div 
      style={getContainerStyle()}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => !isUploading && document.getElementById('csvFileInput').click()}
    >
      {/* Hidden native input element triggered by click wrapper */}
      <input 
        id="csvFileInput"
        type="file" 
        accept=".csv" 
        onChange={handleFileChange} 
        disabled={isUploading}
        style={{ display: 'none' }}
      />

      {isUploading ? (
        <div>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#0066cc' }}>Uploading Broker Data...</p>
          <div style={{ color: '#555', fontSize: '14px' }}>⏳ {currentProgress}</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>📥</div>
          <p style={{ margin: '0 0 6px 0', fontWeight: '600', color: isDragActive ? '#0066cc' : '#333', fontSize: '16px' }}>
            {isDragActive ? "Drop your file here!" : "Drag & drop your statement here, or click to browse"}
          </p>
          <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#777' }}>Supports standard .csv statement exports</p>
          
          <div style={{ fontSize: '11px', color: '#888', borderTop: '1px solid #eee', paddingTop: '10px', display: 'inline-block', width: '80%' }}>
            <strong>Required Structure:</strong> <code>Contract Code</code>, <code>Action</code>, <code>Filled Qty</code>, <code>Avg Price</code>, <code>Date </code>
          </div>
        </div>
      )}
    </div>
  );
}
