# DevCrypto Analytics Dashboard

A full-stack data analytics application that explores correlations between GitHub developer activity and cryptocurrency price movements. The system fetches real-time crypto data from CoinGecko API and GitHub activity metrics to provide interactive visualizations and statistical analysis.

## Live Demo

**Frontend:** https://main.d2dd880sz9vcam.amplifyapp.com/

## Features

- Real-time cryptocurrency price tracking (Bitcoin, Ethereum, Solana, etc.)
- GitHub repository activity monitoring for crypto projects
- Correlation analysis between developer activity and price movements
- Interactive charts and visualizations with Recharts
- Data export functionality (CSV and PDF)
- Multiple theme support (32 DaisyUI themes)
- AWS Cognito authentication
- Responsive design with mobile support
- Offline detection and graceful degradation

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool & Dev Server |
| Tailwind CSS | Utility-first CSS |
| DaisyUI | Component Library (32 themes) |
| Recharts | Data Visualization |
| AWS Amplify | Authentication & Hosting |
| React Router | Navigation |
| jsPDF | PDF Export |
| Axios | HTTP Client |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express | Web Framework |
| TypeScript | Type Safety |
| serverless-http | Lambda Adapter |
| Axios | External API Calls |
| express-rate-limit | Rate Limiting |
| CORS | Cross-Origin Requests |

### External APIs
| API | Purpose |
|-----|---------|
| CoinGecko API | Cryptocurrency price data |
| GitHub API | Repository activity metrics |

## AWS Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AWS Cloud Infrastructure                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐   │
│   │    Users     │────▶│  CloudFront  │────▶│   AWS Amplify Hosting    │   │
│   │   Browser    │     │     CDN      │     │   (React Frontend)       │   │
│   └──────────────┘     └──────────────┘     └──────────────────────────┘   │
│          │                                              │                    │
│          │                                              │                    │
│          ▼                                              ▼                    │
│   ┌──────────────┐                           ┌──────────────────────────┐   │
│   │   Cognito    │◀──────────────────────────│   Authentication Flow    │   │
│   │  User Pool   │                           │   (Login/Signup/Auth)    │   │
│   └──────────────┘                           └──────────────────────────┘   │
│                                                                              │
│          │                                                                   │
│          ▼                                                                   │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐   │
│   │     API      │────▶│    Lambda    │────▶│   Express.js Backend     │   │
│   │   Gateway    │     │   Function   │     │   (serverless-http)      │   │
│   └──────────────┘     └──────────────┘     └──────────────────────────┘   │
│                                                         │                    │
│                                                         │                    │
│                              ┌───────────────────────────┼───────────────┐   │
│                              │                           │               │   │
│                              ▼                           ▼               ▼   │
│                       ┌────────────┐            ┌────────────┐   ┌──────────┐│
│                       │ CoinGecko  │            │  GitHub    │   │CloudWatch││
│                       │    API     │            │    API     │   │  Logs    ││
│                       └────────────┘            └────────────┘   └──────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### AWS Services Used

| Service | Status | Purpose |
|---------|--------|---------|
| AWS Amplify | Active | Frontend hosting with CI/CD (auto-deploy on push) |
| AWS Cognito | Active | User authentication (signup, login, password reset) |
| AWS Lambda | Ready | Serverless backend deployment |
| API Gateway | Ready | API management and routing |
| CloudWatch | Ready | Logging and monitoring |
| CloudFront | Active | CDN for frontend assets |

### Deployment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     CI/CD Pipeline Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Developer Push                                                 │
│        │                                                         │
│        ▼                                                         │
│   ┌─────────┐     ┌─────────────┐     ┌─────────────────────┐  │
│   │  GitHub │────▶│   Amplify   │────▶│  Build & Deploy     │  │
│   │   Repo  │     │   Console   │     │  (amplify.yml)      │  │
│   └─────────┘     └─────────────┘     └─────────────────────┘  │
│                                                  │               │
│                          ┌───────────────────────┘               │
│                          ▼                                       │
│              ┌─────────────────────┐                            │
│              │   Frontend Build    │                            │
│              │   1. npm ci         │                            │
│              │   2. npm run build  │                            │
│              │   3. Deploy to S3   │                            │
│              └─────────────────────┘                            │
│                          │                                       │
│                          ▼                                       │
│              ┌─────────────────────┐                            │
│              │   Live on Amplify   │                            │
│              │   with CloudFront   │                            │
│              └─────────────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
devcrypto_dashboard/
├── frontend/                    # React + Vite frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard.tsx           # Main dashboard
│   │   │   ├── GitHubStatsPage.tsx     # GitHub activity
│   │   │   ├── CryptoPage.tsx          # Crypto prices
│   │   │   ├── ComparisonPage.tsx      # Correlation analysis
│   │   │   ├── ReportsPage.tsx         # Data exports
│   │   │   ├── LoginPage.tsx           # Authentication
│   │   │   ├── SignupPage.tsx          # User registration
│   │   │   └── ForgotPasswordPage.tsx  # Password reset
│   │   ├── contexts/           # React contexts (Auth, Dashboard)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API services & mock data
│   │   ├── config/             # Amplify configuration
│   │   ├── data/               # Static data (coins list)
│   │   └── types/              # TypeScript type definitions
│   ├── dist/                   # Production build output
│   └── package.json
│
├── backend/                     # Node.js + Express backend API
│   ├── src/
│   │   ├── server.ts           # Express server & routes
│   │   ├── lambda.ts           # AWS Lambda handler
│   │   ├── services/           # Business logic
│   │   │   └── cryptoService.ts    # Crypto & GitHub data
│   │   ├── utils/              # Utility functions
│   │   │   ├── apiClients.ts       # CoinGecko & GitHub clients
│   │   │   └── validation.ts       # Input validation
│   │   └── types/              # TypeScript types
│   ├── dist/                   # Compiled JavaScript
│   └── package.json
│
├── .kiro/                       # Kiro specifications
│   └── specs/
│       └── devcrypto-dashboard/
│           └── design.md       # Design documentation
│
├── amplify.yml                  # AWS Amplify build config
├── package.json                 # Root workspace config
└── README.md                    # This file
```

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- AWS Account (for deployment)
- GitHub Token (optional, for higher API rate limits)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd devcrypto_dashboard
```

2. **Install all dependencies:**
```bash
npm run install:all
```

3. **Set up environment variables:**

**Frontend** (`frontend/.env`):
```env
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_API_URL=http://localhost:5000/api
```

**Backend** (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
GITHUB_TOKEN=your-github-token  # Optional, for higher rate limits
```

4. **Start development servers:**
```bash
npm run dev
```

This starts both frontend (http://localhost:5173) and backend (http://localhost:5000) concurrently.

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:frontend` | Start only frontend dev server |
| `npm run dev:backend` | Start only backend dev server |
| `npm run build` | Build both frontend and backend for production |
| `npm run test` | Run all tests |
| `npm run test:frontend` | Run frontend tests only |
| `npm run test:backend` | Run backend tests only |

## API Endpoints

### Base URL
- **Development:** `http://localhost:5000/api`
- **Production:** Your API Gateway URL

### Health Check
```
GET /api/health
```
Returns service status and supported coins list.

### Cryptocurrency Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/crypto/coins` | GET | List all supported cryptocurrencies |
| `/api/crypto/price/:coinId` | GET | Get current price for a coin |
| `/api/crypto/:coinId/:days` | GET | Get historical price data |
| `/api/crypto/github/:coinId/:days` | GET | Get GitHub activity for coin's repo |
| `/api/crypto/correlation/:coinId/:days` | GET | Get correlation analysis |
| `/api/crypto/export/:format/:coinId/:days` | GET | Export data (json/csv) |

### Parameters

| Parameter | Type | Valid Values |
|-----------|------|--------------|
| `coinId` | string | bitcoin, ethereum, solana, cardano, dogecoin, ripple, polkadot, avalanche-2 |
| `days` | number | 7, 14, 30, 60, 90 |
| `format` | string | json, csv |

### Example Requests

```bash
# Get supported coins
curl http://localhost:5000/api/crypto/coins

# Get Bitcoin price data for 30 days
curl http://localhost:5000/api/crypto/bitcoin/30

# Get GitHub activity for Ethereum
curl http://localhost:5000/api/crypto/github/ethereum/30

# Get correlation analysis
curl http://localhost:5000/api/crypto/correlation/bitcoin/30
```

## Supported Cryptocurrencies

| Coin | Symbol | CoinGecko ID | GitHub Repository |
|------|--------|--------------|-------------------|
| Bitcoin | BTC | bitcoin | bitcoin/bitcoin |
| Ethereum | ETH | ethereum | ethereum/go-ethereum |
| Solana | SOL | solana | solana-labs/solana |
| Cardano | ADA | cardano | input-output-hk/cardano-node |
| Dogecoin | DOGE | dogecoin | dogecoin/dogecoin |
| XRP | XRP | ripple | ripple/rippled |
| Polkadot | DOT | polkadot | paritytech/polkadot |
| Avalanche | AVAX | avalanche-2 | ava-labs/avalanchego |

## Deployment

### Frontend (AWS Amplify)

The frontend automatically deploys via AWS Amplify when pushing to the `main` branch.

**amplify.yml configuration:**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

### Backend (AWS Lambda)

1. **Build the backend:**
```bash
cd backend
npm run build
```

2. **Create deployment package:**
```bash
zip -r lambda-backend.zip dist/ node_modules/ package.json
```

3. **Deploy to AWS Lambda:**
   - Upload `lambda-backend.zip` to your Lambda function
   - Set handler to `dist/lambda.handler`
   - Configure API Gateway to route requests

4. **Environment Variables for Lambda:**
```
NODE_ENV=production
GITHUB_TOKEN=your-github-token
```

### AWS Cognito Setup

1. Create a User Pool in AWS Cognito
2. Create an App Client (without client secret)
3. Configure sign-in options (email/username)
4. Add the User Pool ID and Client ID to frontend environment variables

## Correlation Analysis

The dashboard calculates Pearson correlation coefficients between:

| Metric | Description |
|--------|-------------|
| `commits_price` | GitHub commits vs. crypto price |
| `commits_volume` | GitHub commits vs. trading volume |
| `pullRequests_price` | Pull requests vs. crypto price |
| `stars_price` | Repository stars vs. crypto price |

**Interpretation:**
- `1.0`: Perfect positive correlation
- `0.0`: No correlation
- `-1.0`: Perfect negative correlation

## Available Themes

The dashboard supports 32 DaisyUI themes:

light, dark, cupcake, bumblebee, emerald, corporate, synthwave, retro, cyberpunk, valentine, halloween, garden, forest, aqua, lofi, pastel, fantasy, wireframe, black, luxury, dracula, cmyk, autumn, business, acid, lemonade, night, coffee, winter, dim, nord, sunset

## Rate Limiting

- **Development:** 1000 requests per 15 minutes
- **Production:** 100 requests per 15 minutes

## Data Caching

- Frontend caches API responses for 5 minutes
- Falls back to mock data when APIs are unavailable

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
