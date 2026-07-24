# Monopoly - Stock Portfolio Tracker

Deployed site: https://monopoly-theta-seven.vercel.app/

### Test Account

You can use the following test account to explore the application without creating a new account:

* Email: tester@gmail.com
* Password: tester

## Overview

Monopoly is a full-stack stock portfolio tracking web application that allows users to create an account, log in, and manage their investment transactions.

Users can record buy and sell transactions, view their current holdings, track portfolio value, and visualize portfolio performance over time.

The application uses Next.js for both the frontend and backend API routes, Neon PostgreSQL for cloud database storage, Yahoo Finance for market data, and Chart.js for portfolio visualization.

## Important Note

Monopoly is a portfolio tracking application. It does not execute real stock trades. Users manually record their own buy and sell transactions so that the app can calculate holdings and portfolio performance.

## Deployed Application

```txt
https://monopoly-theta-seven.vercel.app/
```

## Feature Summary

* User registration and login
* Password hashing
* User-specific dashboard
* Buy and sell transaction recording
* CSV transaction upload
* Holdings CSV export
* Transaction editing and deletion
* Portfolio holdings calculation
* Currency-based holdings display
* Watchlist page
* Yahoo Finance market data integration
* Ticker autocomplete
* Portfolio value timeline chart
* Neon PostgreSQL database integration
* Vercel deployment
* Reports page with portfolio analytics
* Individual stock search and analytics page
* Stock price chart with timeline filters
* Company profile and valuation metrics
* Recent stock news display
* NLP-based stock sentiment analysis
* Bullish, neutral, and bearish article classification with confidence scores

## Technology Stack

### Frontend

* Next.js
* React.js
* JavaScript
* HTML
* CSS
* Chart.js
* react-chartjs-2

### Backend

* Next.js API Routes
* Node.js
* Server-side NLP inference route

### Database

* PostgreSQL
* Neon

### Market Data and NLP

* yahoo-finance2
* Hugging Face Inference API
* FinBERT financial sentiment model

### Deployment

* Vercel
* Neon
* GitHub

##Testing

* Vitest
* React Testing Library
* jsdom

## Project Structure

```txt
Monopoly
├── backend
│   ├── package-lock.json
│   ├── package.json
│   └── server.js
│
├── frontend
│   ├── public
│   │
│   ├── __tests__
│   │   ├── components.test.jsx
│   │   └── holdings.test.jsx
│   │
│   ├── src
│   │   ├── app
│   │   │   ├── api
│   │   │   │   ├── auth
│   │   │   │   │   ├── login
│   │   │   │   │   │   └── route.js
│   │   │   │   │   └── register
│   │   │   │   │       └── route.js
│   │   │   │   │
│   │   │   │   ├── health
│   │   │   │   │   └── route.js
│   │   │   │   │
│   │   │   │   ├── holdings
│   │   │   │   │   └── [userId]
│   │   │   │   │       └── route.js
│   │   │   │   │
│   │   │   │   ├── market
│   │   │   │   │   ├── history
│   │   │   │   │   │   └── route.js
│   │   │   │   │   ├── quote
│   │   │   │   │   │   └── route.js
│   │   │   │   │   ├── search
│   │   │   │   │   │   └── route.js
│   │   │   │   │   ├── sentiment
│   │   │   │   │   │   └── route.js
│   │   │   │   │   └── summary
│   │   │   │   │       └── route.js
│   │   │   │   │
│   │   │   │   ├── portfolio
│   │   │   │   │   └── timeline
│   │   │   │   │       └── [userId]
│   │   │   │   │           └── route.js
│   │   │   │   │
│   │   │   │   ├── transactions
│   │   │   │   │   ├── [id]
│   │   │   │   │   │   └── route.js
│   │   │   │   │   └── route.js
│   │   │   │   │
│   │   │   │   └── watchlist
│   │   │   │       ├── [id]
│   │   │   │       │   └── route.js
│   │   │   │       └── route.js
│   │   │   │
│   │   │   ├── buy-sell
│   │   │   │   └── page.js
│   │   │   │
│   │   │   ├── dashboard
│   │   │   │   └── page.js
│   │   │   │
│   │   │   ├── transactions
│   │   │   │   └── page.js
│   │   │   │
│   │   │   ├── reports
│   │   │   │   └── page.js
│   │   │   │
│   │   │   ├── stocks
│   │   │   │   └── [symbol]
│   │   │   │       │── page.js
│   │   │   │       │── loading.js
│   │   │   │       │── StockChart.js
│   │   │   │       │── StockSentiment.js
│   │   │   │       └── style.module.css
│   │   │   │
│   │   │   ├── utils
│   │   │   │   └── marketData.js
│   │   │   │
│   │   │   ├── favicon.ico
│   │   │   ├── globals.css
│   │   │   ├── layout.js
│   │   │   └── page.js
│   │   │
│   │   └── components
│   │       ├── BuySellForm.js
│   │       ├── CSVuploader.js
│   │       ├── Navbar.js
│   │       ├── PortfolioTimeline.js
│   │       ├── SummaryCards.js
│   │       ├── Watchlist.js
│   │       ├── TickerAutocomplete.js
│   │       └── TransactionsTable.js
│   │
│   ├── .gitignore
│   ├── eslint.config.mjs
│   ├── jsconfig.json
│   ├── package-lock.json
│   └── package.json
│
├── .gitignore
├── README.md
└── package-lock.json
```

## Implemented Features and Implementation Details

### 1. User Authentication

The application allows users to create an account, log in, and access a user-specific dashboard.

Implemented authentication features include:

* User registration
* User login
* Duplicate email validation
* Password hashing for safer credential storage
* Logout functionality
* User-specific dashboard access using stored login information

User authentication was implemented using Next.js API routes. When a user signs up, the application sends the email and password to a registration API route. The password is hashed before being stored in the Neon PostgreSQL database. During login, the submitted password is compared with the hashed password in the database. Once login is successful, the user information is stored in local storage so that the dashboard can identify the logged-in user.

### 2. Portfolio Dashboard

After logging in, users are redirected to the dashboard. The dashboard provides an overview of the user's current portfolio based on their saved transactions.

The dashboard displays:

* Current holdings
* Shares or units owned
* Average purchase price
* Total cost
* Current market price
* Final portfolio value
* Total returns
* Return percentage

The dashboard is built using React components in Next.js. After login, the dashboard reads the logged-in user from local storage and passes the user ID into components such as `SummaryCards` and `PortfolioTimeline`. These components call API routes to retrieve the user's holdings, market prices, and timeline data, then display the calculated values on the page.

### 3. Transaction Management

Users can record both buy and sell transactions.

Each transaction stores:

* Stock or asset ticker
* Transaction type, either `BUY` or `SELL`
* Quantity
* Price per share or unit
* Transaction date
* User ID

The application uses these transaction records to calculate the user's current holdings and portfolio value.

Transactions are submitted from the frontend form to a Next.js API route. The API route validates the transaction data and inserts it into the PostgreSQL `transactions` table. Each transaction is linked to the logged-in user through `user_id`, allowing the application to retrieve only that user's transactions.

### 4. CSV Transaction Upload

The application supports uploading transactions through CSV files. This allows users to add multiple transactions more quickly instead of entering them one by one.

The CSV file must follow a specific format so that the application can correctly read and store the data.

Required columns:

* `ticker`
* `type`
* `quantity`
* `price`
* `transaction_date`

Example CSV format:

```csv
ticker,type,quantity,price,transaction_date
AAPL,BUY,10,180,2024-01-15
VOO,BUY,5,400,2024-02-10
D05:SGX,SELL,2,30,2024-03-05
```

Notes:

* The first row must contain the column headers exactly as shown.
* The `type` field must be either `BUY` or `SELL`.
* The `transaction_date` should be in `YYYY-MM-DD` format.
* Quantity and price must be numeric values.

CSV upload was implemented using the `papaparse` package. The frontend reads the uploaded CSV file, parses each row into transaction data, validates the required fields, and sends each valid transaction to the transaction API route for database insertion.

### 5. Holdings CSV Export 
The application allows users to export their current holdings as a CSV file. 
The exported file includes useful portfolio information such as: 
* Ticker
* Quantity
* Average cost
* Current price
* Final value
* Currency
* Returns
* Return percentage
This feature allows users to download a simple portfolio report from the dashboard. The export is generated directly in the browser using the current holdings data shown on the page, so no additional backend route is required.
This export is designed as a holdings report rather than a transaction import file because it includes calculated values such as current market price, final value, and returns.

### 6. Holdings Calculation

The application calculates holdings from the user's transaction history.

For example:

* `BUY` transactions increase the user's holdings.
* `SELL` transactions decrease the user's holdings.
* The app calculates the remaining quantity owned for each ticker.
* The app calculates the average cost based on buy transactions.

Holdings are calculated using a Next.js API route that queries the `transactions` table. SQL aggregation is used to group transactions by ticker. `BUY` quantities are added, while `SELL` quantities are subtracted. The average cost is calculated from buy transactions, and tickers with zero or negative remaining quantity are excluded from the holdings display.

### 7. Currency-Based Portfolio Display

The dashboard groups holdings by currency, such as USD and SGD.

This is useful because the application supports assets from different markets, including US stocks and Singapore-listed stocks. Separating holdings by currency makes the portfolio easier to understand and avoids mixing values from different currencies.

The application fetches market data for each ticker using Yahoo Finance. Each quote includes currency information, such as USD or SGD. The frontend groups holdings based on the returned currency and displays separate portfolio sections for each currency.

The dashboard also periodically refetches market prices from the market data API so that portfolio values and returns can update without requiring the user to manually refresh the page.

This was implemented using a timed refresh interval in the frontend. The React component calls the holdings and quote API routes at regular intervals, updates the latest market prices, and recalculates portfolio value and returns.

For normal use, the refresh interval can be set to a larger value such as 30 seconds to reduce unnecessary API calls and avoid rate limits. A shorter interval, such as 1 second, can be used for local testing or demonstration purposes.

### 8. Yahoo Finance Market Data Integration

The application integrates Yahoo Finance using the `yahoo-finance2` package.

This allows the app to fetch:

* Current market prices
* Historical price data
* Ticker search results

The market data is used to calculate current portfolio value and portfolio returns.

Market data is handled through Next.js API routes that use the `yahoo-finance2` package. The quote route fetches current prices, the history route fetches historical price data, and the search route retrieves ticker search results.

Ticker symbols are normalized before being sent to Yahoo Finance. For example, `D05:SGX` is converted to the Yahoo-compatible symbol `D05.SI`.

### 9. Ticker Autocomplete

The transaction form includes a ticker autocomplete feature.

Users can search for tickers dynamically instead of manually typing every symbol. This improves the user experience and reduces the chance of invalid ticker input.

Supported asset examples include:

* US stocks, such as `AAPL`
* ETFs, such as `VOO`
* Singapore stocks, such as `D05:SGX`
* Cryptocurrencies, such as `BTC/USD:DIGITAL_CURRENCY`

The autocomplete input checks the user's search query and sends it to a ticker search API route. This API route uses Yahoo Finance search results and returns matching assets. The frontend displays these results in a dropdown, and selecting one fills the transaction ticker field.

### 10. Watchlist 
The application includes a watchlist page that allows users to track tickers without adding them as portfolio holdings. 

Users can add and remove tickers from their watchlist. Each watchlist item is linked to the logged-in user and stored in the Neon PostgreSQL database. 

The watchlist also fetches current market prices using the Yahoo Finance quote API. Saved tickers are grouped by currency, such as USD and SGD, so users can easily monitor assets from different markets.

This feature is useful for tracking stocks, ETFs, Singapore-listed stocks, and cryptocurrencies before deciding whether to add them to the main portfolio.

### 11. Portfolio Timeline Chart

The application includes a portfolio timeline chart built using Chart.js.

The chart shows how the user's portfolio value changes over time. It is generated using:

* User transaction history
* Historical Yahoo Finance prices
* Daily portfolio value calculations

This feature helps users visualize portfolio growth, losses, and performance trends.

The timeline chart uses a Next.js API route that retrieves the user's transactions and fetches historical prices for each ticker. The route simulates the user's holdings over time by applying `BUY` and `SELL` transactions in date order. It then calculates the portfolio value for each date and returns the data to the frontend. The `PortfolioTimeline` React component uses Chart.js and `react-chartjs-2` to display the data as a line chart.

### 12. Reports Page

The application includes a reports page that provides a more analytical view of the user's portfolio.

The reports page is designed to summarize portfolio performance and provide users with a clearer understanding of their holdings beyond the main dashboard.

The reports page can include:

Portfolio value summary
Portfolio returns
Currency exposure
Holdings breakdown
Performance trends
Risk and diversification-related metrics

This feature separates higher-level portfolio analysis from the main dashboard. The dashboard focuses on daily portfolio tracking, while the reports page focuses on analytical insights and portfolio review.

The reports page uses existing transaction, holdings, market price, and historical price data from the application's backend API routes. This allows the app to reuse the same market data and portfolio calculation logic while presenting the information in a more report-style format.

### 13. Individual Stock Analytics Page

The application includes a dynamic individual stock analytics page.

Users can search for or select a stock ticker and open a dedicated stock page such as:

/stocks/NVDA
/stocks/AAPL
/stocks/D05.SI
/stocks/BTC-USD

Each stock page displays detailed market and company information for the selected asset.

The individual stock page includes:

Stock ticker and company name
Current market price
Daily price change and percentage change
Exchange and currency
Company sector and industry
Market capitalization
Business summary
Valuation metrics
Recent news
Interactive price chart
NLP-based sentiment analysis

This feature gives users a research-style workflow similar to financial platforms such as Yahoo Finance. Instead of only tracking owned holdings, users can inspect individual stocks in more detail before adding them to their portfolio or watchlist.

The page is implemented using a dynamic Next.js route at:

src/app/stocks/[symbol]/page.js

The page retrieves market data using a shared marketData utility and displays the result using modular components such as StockChart and StockSentiment.

### 14. Stock Price Chart with Timeline Filters

The individual stock analytics page includes an interactive stock price chart built using Chart.js and react-chartjs-2.

The chart displays historical closing prices for the selected stock or asset. Users can switch between different timeline ranges, such as:

1M
3M
6M
YTD
1Y
ALL

The chart data is retrieved from the Yahoo Finance history API route. The frontend fetches historical prices, filters the data based on the selected timeline, and renders the closing price as a line chart.

This feature allows users to visually inspect recent and long-term price movement for each stock. It also reuses the same Chart.js library already used for the portfolio timeline chart, keeping the visualization stack consistent across the application.

### 15. Fundamental Stock Data and Recent News

The individual stock page displays fundamental company information and recent news.

The fundamental section includes:

P/E ratio
P/B ratio
Return on equity
Return on assets
Net profit margin
Debt-to-equity ratio

The company profile section includes:

Sector
Industry
Market capitalization
Business description

This data is fetched using the yahoo-finance2 package through a server-side utility function. The app requests Yahoo Finance modules such as price, summaryDetail, defaultKeyStatistics, assetProfile, and financialData.

The recent news section retrieves news articles related to the selected ticker. News articles are sorted by publish time and displayed with their title, source, and formatted publication date.

This feature makes the individual stock page more useful for investment research because users can view both quantitative company metrics and recent qualitative news in one place.

### 16. NLP-Based Stock Sentiment Analysis

The application includes an NLP-based stock sentiment analysis feature on the individual stock analytics page.

The system retrieves recent stock-related news and sends each article headline to a finance-specific NLP sentiment model. The model classifies each article as positive, neutral, or negative. The application then maps these labels into investment-style sentiment labels:

Positive → Bullish
Neutral → Neutral
Negative → Bearish

Each article receives:

Sentiment label
Confidence score
Numeric sentiment score

The sentiment score is calculated as:

Bullish = positive confidence score
Neutral = 0
Bearish = negative confidence score

The app then aggregates the article-level scores into an overall stock sentiment score. This gives users a simple summary of whether recent news sentiment is generally bullish, neutral, or bearish.

The sentiment analyser is displayed inside the individual stock page. To keep the UI clean, the card first shows only the overall sentiment summary, article count, and bullish/neutral/bearish breakdown. Users can expand a dropdown to view the individual analysed news articles and their confidence scores.

This feature adds an AI/NLP layer to the application and demonstrates integration between market data, financial news, backend API processing, and machine learning inference.

### 17. Neon PostgreSQL Database Integration

The application uses Neon PostgreSQL as its cloud-hosted database.

The database stores:

* User account information
* Hashed passwords
* Transaction records
* Watchlist records
* Data required to calculate holdings and portfolio performance

Using Neon allows the application to store persistent data even after the app is redeployed.

The application connects to Neon PostgreSQL using the `pg` package. The database connection string is stored in environment variables as `DATABASE_URL`. API routes create database queries through a PostgreSQL connection pool, allowing the app to read and write user and transaction data.

### 18. Next.js API Routes

The backend logic is implemented using Next.js API routes.

Implemented API routes include:

* Authentication routes
* Transaction routes
* Holdings calculation routes
* Market data routes
* Portfolio timeline routes

The frontend calls these routes using relative paths such as `/api/auth/login` and `/api/transactions`, which work both locally and on Vercel.

### 19. Vercel Deployment

The application is deployed on Vercel.

Vercel is used to host:

* The frontend pages
* The Next.js API routes
* The deployed production version of the application

The project also uses GitHub integration for continuous deployment, meaning new changes can be deployed after pushing updates to GitHub.

The project was connected to Vercel through GitHub. The `frontend` folder is used as the deployment root. The Neon database connection string is added to Vercel as an environment variable, allowing the deployed API routes to connect to the production database.

## Database Schema

### Users Table

| Column     | Type         | Description                |
| ---------- | ------------ | -------------------------- |
| id         | SERIAL       | Primary key                |
| email      | VARCHAR(255) | Unique user email          |
| password   | VARCHAR(255) | Hashed user password       |
| created_at | TIMESTAMP    | Account creation timestamp |

### Transactions Table

| Column           | Type        | Description                                  |
| ---------------- | ----------- | -------------------------------------------- |
| id               | SERIAL      | Primary key                                  |
| user_id          | INTEGER     | References the user who owns the transaction |
| ticker           | TEXT        | Stock, ETF, SGX, or crypto ticker            |
| type             | VARCHAR(10) | BUY or SELL                                  |
| quantity         | NUMERIC     | Number of shares or units                    |
| price            | NUMERIC     | Transaction price per share or unit          |
| transaction_date | DATE        | Date of transaction                          |
| created_at       | TIMESTAMP   | Record creation timestamp                    |

### Watchlist Table

| Column     | Type         | Description                                     |
| ---------- | ------------ | ----------------------------------------------- |
| id         | SERIAL       | Primary key                                     |
| user_id    | INTEGER      | References the user who owns the watchlist item |
| ticker     | TEXT         | Stock, ETF, SGX, or crypto ticker               |
| created_at | TIMESTAMP    | Record creation timestamp                       |

## Installation Requirements

### For Normal Users

Normal users do not need to install anything.

They can access the deployed application directly through the website:

```txt
https://monopoly-theta-seven.vercel.app/
```

### For Developers

Developers who want to run the project locally need the following:

* Node.js
* npm
* Git
* Neon PostgreSQL database
* Vercel account for deployment

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/axelkerjun/Monopoly.git
cd Monopoly/frontend
```

### 2. Install Dependencies

```bash
npm install
```

This installs all packages listed in `package.json`, including:

* `next`
* `react`
* `react-dom`
* `pg`
* `bcrypt`
* `papaparse`
* `yahoo-finance2`
* `chart.js`
* `react-chartjs-2`
* `@huggingface/inference`
* `vitest`
* `@testing-library/react`
* `@testing-library/jest-dom`
* `jsdom`

### 3. Configure Environment Variables

Create a .env.local file inside the frontend folder.

DATABASE_URL=your_neon_connection_string
HF_TOKEN=your_hugging_face_token

DATABASE_URL is used to connect the application to the Neon PostgreSQL database.

HF_TOKEN is used by the stock sentiment analysis API route to call the hosted Hugging Face FinBERT sentiment model.

Do not commit .env.local to GitHub because it contains private credentials.

Do not commit `.env.local` to GitHub because it contains private database credentials.

### 4. Set Up the Database

Create the required tables in Neon PostgreSQL.

Required tables:

* `users`
* `transactions`
* `watchlist`

### 5. Run the Development Server

```bash
npm run dev
```

Open the app at:

```txt
http://localhost:3000
```

## Deployment

### Deploy to Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Set the root directory to `frontend`.
4. Add the required environment variable:

```env
DATABASE_URL=your_neon_connection_string
HF_TOKEN=your_hugging_face_token
```
DATABASE_URL allows the deployed API routes to connect to the Neon database.

HF_TOKEN allows the deployed sentiment analysis route to call the Hugging Face inference API.

5. Deploy the project.

### Connect Neon Database

1. Create a Neon PostgreSQL project.
2. Copy the PostgreSQL connection string.
3. Add it to `.env.local` for local development.
4. Add it to Vercel Environment Variables for production.
5. Run the SQL schema setup in Neon.

## Summary of Required Developer Tools

| Tool            | Purpose                                    |
| --------------- | ------------------------------------------ |
| Node.js         | Runs the Next.js application locally       |
| npm             | Installs project dependencies              |
| Git and GitHub  | Version control and deployment integration |
| Next.js         | Frontend and backend framework             |
| Neon PostgreSQL | Cloud database                             |
| Vercel          | Deployment platform                        |
| yahoo-finance2  | Fetches Yahoo Finance market data          |
| Chart.js        | Displays the portfolio timeline graph      |
| Hugging Face Inference API | Runs the FinBERT financial sentiment model
| FinBERT | Classifies stock news as bullish, neutral, or bearish

## Technical Decisions

### Why Next.js API Routes?

The project originally used a separate backend server, but this created deployment issues because the deployed frontend could not call `localhost:5000`. The backend logic was moved into Next.js API routes so that the frontend and backend could be deployed together on Vercel. This made the app easier to deploy and allowed frontend requests to use relative paths such as `/api/auth/login`.

### Why Neon PostgreSQL?

Neon was chosen because it provides a cloud-hosted PostgreSQL database that works well with deployed applications. It allows user and transaction data to persist even after the Vercel app is redeployed.

### Why Yahoo Finance?

Yahoo Finance was used through the `yahoo-finance2` package because the app requires current prices, historical prices, and ticker search. This supports the portfolio dashboard, ticker autocomplete, and portfolio timeline chart.

### Why Chart.js?

Chart.js was chosen to visualize portfolio value over time because it is lightweight, widely used, and integrates well with React through `react-chartjs-2`.

### Why Individual Stock Analytics?

The individual stock analytics page was added to separate stock research from portfolio tracking. The dashboard focuses on the user's owned holdings, while the individual stock page allows users to inspect any selected stock in more detail.

### Why NLP Sentiment Analysis?

NLP sentiment analysis was added to provide an AI-driven qualitative signal for stock research.

Financial news can affect investor perception, but manually reading multiple articles is time-consuming. The sentiment analyser processes recent stock news headlines using a finance-specific language model and classifies each article as bullish, neutral, or bearish.

The feature is not intended to predict stock prices. Instead, it provides an additional research signal by summarizing the tone of recent stock-related news.

This improves the user workflow because users can search for a stock, view its price chart, review company fundamentals, read recent news, and check NLP-based sentiment before deciding whether to add it to their watchlist or portfolio.

### Why Hugging Face and FinBERT?

Hugging Face was used because it allows the application to call a hosted NLP model from a backend API route without maintaining a separate Python machine learning server.

FinBERT was selected because it is designed for financial sentiment classification. This makes it more suitable for stock-related news than a general-purpose sentiment model.

## Software Engineering Practices Applied

### Modular Design
The application is divided into reusable React components such as `SummaryCards`, `CSVuploader`, `TickerAutocomplete`, and `PortfolioTimeline`.

### Separation of Concerns
Frontend display logic is handled by React components, while backend and database logic are handled by Next.js API routes.

### Environment-Based Configuration
Sensitive configuration such as the Neon PostgreSQL connection string is stored in environment variables instead of being hardcoded.

### Input Validation
Transaction forms and CSV uploads validate required fields such as ticker, type, quantity, price, and transaction date before saving data.

### CI/CD
The project uses GitHub and Vercel so that changes pushed to the repository can be automatically built and deployed.

### Client-Side File Generation 
The holdings CSV export is generated on the client side using JavaScript. The application converts the current holdings data into CSV format and creates a downloadable file in the browser. This avoids the need for an additional backend export route.

### Feature Modularity
The watchlist feature is separated into its own page, component, API routes, and database table. This keeps the feature easier to maintain and prevents the dashboard code from becoming too crowded.

### Dynamic Routing

The individual stock analytics page uses a dynamic Next.js route at /stocks/[symbol]. This allows the same page component to render analytics for different stocks based on the selected ticker.

### Backend API Encapsulation

The sentiment analysis logic is kept inside a server-side API route. This prevents the Hugging Face API token from being exposed to the frontend and keeps external model calls separated from UI components.

### Reusable Analytics Components

The stock chart and sentiment analyser are implemented as separate components. This keeps the individual stock page easier to maintain and allows each analytics feature to be developed independently.

### Data Normalization

Market data from Yahoo Finance is normalized before being displayed. This includes converting URL symbols, handling different timestamp formats, sorting news by publish time, and formatting values such as currency, percentages, and ratios.

## Testing

The project includes automated tests using Vitest and React Testing Library.

Testing is used to verify both frontend component rendering and portfolio calculation logic. This helps ensure that key parts of the application continue working correctly when new features are added.

### Test Files

| Test File | Purpose |
|---|---|
| `frontend/__tests__/components.test.jsx` | Tests dashboard UI rendering and return styling |
| `frontend/__tests__/holdings.test.js` | Tests holdings calculation logic for buy and sell transactions |

### Component UI Tests

The component test checks whether the portfolio summary UI renders the correct values and applies the correct styling based on portfolio returns.

The test verifies that:

- Portfolio summary text renders correctly
- Net worth values display correctly
- Positive returns are styled in green
- Negative returns are styled in red

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/register`               | POST | Registers a new user |
| `/api/auth/login`                  | POST | Authenticates an existing user |
| `/api/transactions`                | GET | Retrieves user transactions |
| `/api/transactions`                | POST | Saves a new transaction |
| `/api/transactions/[id]`           | PATCH | Updates an existing transaction |
| `/api/transactions/[id]`           | DELETE | Deletes a transaction |
| `/api/holdings/[userId]`           | GET | Calculates current holdings |
| `/api/market/quote`                | GET | Fetches current market price |
| `/api/market/history`              | GET | Fetches historical price data |
| `/api/market/search`               | GET | Searches tickers for autocomplete |
| `/api/market/summary` | GET | Fetches stock overview, profile, ratios, and recent news
| `/api/market/sentiment` | GET | Runs NLP sentiment analysis on recent stock news
| `/api/portfolio/timeline/[userId]` | GET | Generates portfolio timeline data |
| `/api/watchlist`                   | GET | Retrieves the logged-in user's watchlist |
| `/api/watchlist`                   | POST | Adds a ticker to the user's watchlist |
| `/api/watchlist/[id]`              | DELETE | Removes a ticker from the user's watchlist |


## Feature Evidence

| Feature | Evidence |
|---|---|
| Authentication | `src/app/api/auth/login/route.js`, `src/app/api/auth/register/route.js` |
| Transaction Management | `src/app/api/transactions/route.js` |
| Holdings Calculation | `src/app/api/holdings/[userId]/route.js` |
| Market Data | `src/app/api/market/quote/route.js`, `src/app/api/market/history/route.js` |
| Ticker Autocomplete | `src/components/TickerAutocomplete.js` |
| Portfolio Timeline | `src/components/PortfolioTimeline.js`, `src/app/api/portfolio/timeline/[userId]/route.js` |
| CSV Upload | `src/components/CSVuploader.js` |
| Watchlist | `src/components/Watchlist.js`, `src/app/watchlist/page.js`, `src/app/api/watchlist/route.js` |
| Holdings CSV Export | `src/components/SummaryCards.js` |
| Reports Page | src/app/reports/page.js
| Individual Stock Analytics | src/app/stocks/[symbol]/page.js, src/app/utils/marketData.js
| Stock Price Chart | src/app/stocks/[symbol]/StockChart.js, src/app/api/market/history/route.js
| Stock Sentiment Analysis | src/app/stocks/[symbol]/StockSentiment.js, src/app/api/market/sentiment/route.js
| Stock Summary Data | src/app/api/market/summary/route.js, src/app/utils/marketData.js
| Testing | `frontend/__tests__/components.test.jsx`, `frontend/__tests__/holdings.test.js` |

## Limitations

* NLP sentiment analysis is based on recent news headlines and should not be interpreted as a stock price prediction.
* Sentiment results depend on the availability and quality of recent Yahoo Finance news.
* Some non-US stocks and cryptocurrencies may have limited fundamental data or news coverage.

## Summary 

Summary

Monopoly is a portfolio tracking application that combines software engineering, market data integration, and quantitative finance concepts. It allows users to manage transactions, calculate holdings, fetch market prices, monitor watchlist tickers, export portfolio reports, and visualize portfolio performance over time.

The application also includes a reports page for portfolio-level analytics and an individual stock analytics page for deeper stock research. Users can view stock fundamentals, interactive price charts, recent news, and NLP-based sentiment analysis for selected stocks.

The project demonstrates full-stack development using Next.js API routes, Neon PostgreSQL, Yahoo Finance market data, Chart.js visualizations, and AI-powered financial sentiment analysis.
