# Monopoly - Stock Portfolio Tracker

Deployed site: https://monopoly-theta-seven.vercel.app/

### Test Account

You can use the following test account to explore the application without creating a new account:

* Email: [tester@gmail.com](mailto:test@example.com)
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
* Transaction editing and deletion
* Portfolio holdings calculation
* Currency-based holdings display
* Yahoo Finance market data integration
* Ticker autocomplete
* Portfolio value timeline chart
* Neon PostgreSQL database integration
* Vercel deployment

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

### Database

* PostgreSQL
* Neon

### Market Data

* yahoo-finance2

### Deployment

* Vercel
* Neon
* GitHub

## Project Structure

```txt
Monopoly
├── frontend
│   ├── src
│   │   ├── app
│   │   │   ├── api
│   │   │   │   ├── auth
│   │   │   │   ├── transactions
│   │   │   │   ├── holdings
│   │   │   │   ├── market
│   │   │   │   └── portfolio
│   │   │   ├── dashboard
│   │   │   └── page.js
│   │   ├── components
│   │   │   ├── CSVuploader.js
│   │   │   ├── Navbar.js
│   │   │   ├── PortfolioTimeline.js
│   │   │   ├── SummaryCards.js
│   │   │   └── TickerAutocomplete.js
│   │   └── lib
│   ├── package.json
│   └── .env.local
└── README.md
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

### 5. Holdings Calculation

The application calculates holdings from the user's transaction history.

For example:

* `BUY` transactions increase the user's holdings.
* `SELL` transactions decrease the user's holdings.
* The app calculates the remaining quantity owned for each ticker.
* The app calculates the average cost based on buy transactions.

Holdings are calculated using a Next.js API route that queries the `transactions` table. SQL aggregation is used to group transactions by ticker. `BUY` quantities are added, while `SELL` quantities are subtracted. The average cost is calculated from buy transactions, and tickers with zero or negative remaining quantity are excluded from the holdings display.

### 6. Currency-Based Portfolio Display

The dashboard groups holdings by currency, such as USD and SGD.

This is useful because the application supports assets from different markets, including US stocks and Singapore-listed stocks. Separating holdings by currency makes the portfolio easier to understand and avoids mixing values from different currencies.

The application fetches market data for each ticker using Yahoo Finance. Each quote includes currency information, such as USD or SGD. The frontend groups holdings based on the returned currency and displays separate portfolio sections for each currency.

### 7. Yahoo Finance Market Data Integration

The application integrates Yahoo Finance using the `yahoo-finance2` package.

This allows the app to fetch:

* Current market prices
* Historical price data
* Ticker search results

The market data is used to calculate current portfolio value and portfolio returns.

Market data is handled through Next.js API routes that use the `yahoo-finance2` package. The quote route fetches current prices, the history route fetches historical price data, and the search route retrieves ticker search results.

Ticker symbols are normalized before being sent to Yahoo Finance. For example, `D05:SGX` is converted to the Yahoo-compatible symbol `D05.SI`.

### 8. Ticker Autocomplete

The transaction form includes a ticker autocomplete feature.

Users can search for tickers dynamically instead of manually typing every symbol. This improves the user experience and reduces the chance of invalid ticker input.

Supported asset examples include:

* US stocks, such as `AAPL`
* ETFs, such as `VOO`
* Singapore stocks, such as `D05:SGX`
* Cryptocurrencies, such as `BTC/USD:DIGITAL_CURRENCY`

The autocomplete input checks the user's search query and sends it to a ticker search API route. This API route uses Yahoo Finance search results and returns matching assets. The frontend displays these results in a dropdown, and selecting one fills the transaction ticker field.

### 9. Portfolio Timeline Chart

The application includes a portfolio timeline chart built using Chart.js.

The chart shows how the user's portfolio value changes over time. It is generated using:

* User transaction history
* Historical Yahoo Finance prices
* Daily portfolio value calculations

This feature helps users visualize portfolio growth, losses, and performance trends.

The timeline chart uses a Next.js API route that retrieves the user's transactions and fetches historical prices for each ticker. The route simulates the user's holdings over time by applying `BUY` and `SELL` transactions in date order. It then calculates the portfolio value for each date and returns the data to the frontend. The `PortfolioTimeline` React component uses Chart.js and `react-chartjs-2` to display the data as a line chart.

### 10. Neon PostgreSQL Database Integration

The application uses Neon PostgreSQL as its cloud-hosted database.

The database stores:

* User account information
* Hashed passwords
* Transaction records
* Data required to calculate holdings and portfolio performance

Using Neon allows the application to store persistent data even after the app is redeployed.

The application connects to Neon PostgreSQL using the `pg` package. The database connection string is stored in environment variables as `DATABASE_URL`. API routes create database queries through a PostgreSQL connection pool, allowing the app to read and write user and transaction data.

### 11. Next.js API Routes

The backend logic is implemented using Next.js API routes.

Implemented API routes include:

* Authentication routes
* Transaction routes
* Holdings calculation routes
* Market data routes
* Portfolio timeline routes

The frontend calls these routes using relative paths such as `/api/auth/login` and `/api/transactions`, which work both locally and on Vercel.

### 12. Vercel Deployment

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

### 3. Configure Environment Variables

Create a `.env.local` file inside the `frontend` folder.

```env
DATABASE_URL=your_neon_connection_string
```

Do not commit `.env.local` to GitHub because it contains private database credentials.

### 4. Set Up the Database

Create the required tables in Neon PostgreSQL.

Required tables:

* `users`
* `transactions`

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
```

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

## Technical Decisions

### Why Next.js API Routes?

The project originally used a separate backend server, but this created deployment issues because the deployed frontend could not call `localhost:5000`. The backend logic was moved into Next.js API routes so that the frontend and backend could be deployed together on Vercel. This made the app easier to deploy and allowed frontend requests to use relative paths such as `/api/auth/login`.

### Why Neon PostgreSQL?

Neon was chosen because it provides a cloud-hosted PostgreSQL database that works well with deployed applications. It allows user and transaction data to persist even after the Vercel app is redeployed.

### Why Yahoo Finance?

Yahoo Finance was used through the `yahoo-finance2` package because the app requires current prices, historical prices, and ticker search. This supports the portfolio dashboard, ticker autocomplete, and portfolio timeline chart.

### Why Chart.js?

Chart.js was chosen to visualize portfolio value over time because it is lightweight, widely used, and integrates well with React through `react-chartjs-2`.

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

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/register` | POST | Registers a new user |
| `/api/auth/login` | POST | Authenticates an existing user |
| `/api/transactions` | GET | Retrieves user transactions |
| `/api/transactions` | POST | Saves a new transaction |
| `/api/transactions/[id]` | PATCH | Updates an existing transaction |
| `/api/transactions/[id]` | DELETE | Deletes a transaction |
| `/api/holdings/[userId]` | GET | Calculates current holdings |
| `/api/market/quote` | GET | Fetches current market price |
| `/api/market/history` | GET | Fetches historical price data |
| `/api/market/search` | GET | Searches tickers for autocomplete |
| `/api/portfolio/timeline/[userId]` | GET | Generates portfolio timeline data |

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

## Limitations

* The application does not execute real trades.
* Market prices are fetched from Yahoo Finance and may be delayed or unavailable for some tickers.
* Portfolio values are grouped by currency and are not automatically converted into one base currency.

## Future Enhancements

* Watchlist functionality
* Transaction history filtering
* Risk and volatility analytics
* Stock correlation analysis for hedging
* More advanced portfolio performance metrics
* Automatic live price refresh without manual page reload
* Export portfolio report as CSV
* Improved session management

## Summary

Monopoly is a portfolio tracking application that combines software engineering and quantitative finance concepts. It allows users to manage transactions, calculate holdings, fetch market prices, and visualize portfolio performance over time.

