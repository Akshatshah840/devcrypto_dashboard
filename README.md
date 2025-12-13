# DevCrypto Analytics Dashboard

A data analytics application that explores correlations between GitHub developer activity and cryptocurrency price movements. The system fetches real-time crypto data from CoinGecko API and GitHub activity metrics to provide interactive visualizations and statistical analysis.

## Live Demo

**Frontend:** https://main.d2dd880sz9vcam.amplifyapp.com/

## Features

- Real-time cryptocurrency price tracking (Bitcoin, Ethereum, Solana, etc.)
- GitHub repository activity monitoring for crypto projects
- Correlation analysis between developer activity and price movements
- Interactive charts and visualizations
- Multiple theme support (32 DaisyUI themes)
- AWS Cognito authentication
- Data export functionality (JSON/CSV)

## Project Structure

```
├── frontend/          # React + Vite frontend application
├── backend/           # Node.js + Express backend API (Lambda ready)
├── amplify.yml        # AWS Amplify build configuration
├── package.json       # Root package.json with workspace configuration
└── README.md          # This file
```

## AWS Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   AWS Infrastructure                     │
├─────────────────────────────────────────────────────────┤
│  Cognito (Auth) ✅    │  Amplify Hosting (Frontend) ✅  │
│  API Gateway          │  Lambda (Backend API)           │
│  DynamoDB (Cache)     │  CloudWatch (Logs)              │
└─────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- AWS Account (for deployment)

### Installation

1. Install dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
```bash
# Frontend (.env)
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_API_URL=your-api-url

# Backend (.env)
GITHUB_TOKEN=your-github-token (optional, for higher rate limits)
```

3. Start the development servers:
```bash
npm run dev
```

## API Endpoints

### Crypto Endpoints
- `GET /api/crypto/coins` - List supported cryptocurrencies
- `GET /api/crypto/price/:coinId` - Current price for a coin
- `GET /api/crypto/:coinId/:days` - Historical price data
- `GET /api/crypto/github/:coinId/:days` - GitHub activity for crypto repos
- `GET /api/crypto/correlation/:coinId/:days` - Correlation analysis

### Supported Cryptocurrencies
Bitcoin, Ethereum, Solana, Cardano, Dogecoin, XRP, Polkadot, Avalanche

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for build tooling
- Tailwind CSS + DaisyUI for styling
- Recharts for data visualization
- AWS Amplify for authentication
- React Router for navigation

### Backend
- Node.js + Express + TypeScript
- Serverless-http for Lambda deployment
- CoinGecko API for crypto data
- GitHub API for repository activity
- Rate limiting and caching

### AWS Services
- AWS Cognito - User authentication
- AWS Amplify - Frontend hosting with CI/CD
- AWS Lambda - Serverless backend (planned)
- AWS API Gateway - API management (planned)
- AWS DynamoDB - Data caching (planned)

## Deployment

### Frontend (Amplify)
The frontend is automatically deployed via AWS Amplify when pushing to the main branch.

### Backend (Lambda)
```bash
cd backend
npm run build
zip -r lambda-backend.zip dist/ node_modules/ package.json
# Upload to AWS Lambda
```

## Available Themes

The frontend supports 32 DaisyUI themes including:
light, dark, synthwave, cyberpunk, dracula, night, coffee, and more.