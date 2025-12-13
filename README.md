# GitHub Activity + Air Quality Dashboard

A data mashup application that explores correlations between developer productivity and environmental air quality across major tech hub cities.

## Project Structure

```
├── frontend/          # React + Vite frontend application
├── backend/           # Node.js + Express backend API
├── package.json       # Root package.json with workspace configuration
└── README.md         # This file
```

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Installation

1. Install dependencies for all workspaces:
```bash
npm run install:all
```

2. Start the development servers:
```bash
npm run dev
```

This will start both the frontend (http://localhost:3000) and backend (http://localhost:5000) concurrently.

### Development Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only the frontend development server
- `npm run dev:backend` - Start only the backend development server
- `npm run build` - Build both frontend and backend for production
- `npm run test` - Run tests for both frontend and backend

### Frontend (React + Vite)

- **Port**: 3000
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + DaisyUI (32 themes available)
- **Charts**: Recharts for data visualization
- **Testing**: Jest + React Testing Library + fast-check

### Backend (Node.js + Express)

- **Port**: 5000
- **Framework**: Express with TypeScript
- **Features**: CORS, rate limiting, error handling
- **Testing**: Jest + Supertest + fast-check

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/cities` - List supported tech hub cities
- `GET /api/github/:city/:days` - GitHub activity data
- `GET /api/airquality/:city/:days` - Air quality data
- `GET /api/correlation/:city/:days` - Correlation analysis
- `GET /api/export/:format/:city/:days` - Data export (JSON/CSV)

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for build tooling
- Tailwind CSS + DaisyUI for styling
- Recharts for data visualization
- React Router for navigation
- Axios for HTTP requests

### Backend
- Node.js + Express + TypeScript
- CORS and rate limiting middleware
- Axios for external API calls
- Node-cron for scheduled tasks

### Testing
- Jest for unit testing
- React Testing Library for frontend component testing
- Supertest for backend API testing
- fast-check for property-based testing

## Development

The project uses a monorepo structure with npm workspaces. The frontend proxies API requests to the backend during development.

### Available Themes

The frontend supports 32 DaisyUI themes:
light, dark, cupcake, bumblebee, emerald, corporate, synthwave, retro, cyberpunk, valentine, halloween, garden, forest, aqua, lofi, pastel, fantasy, wireframe, black, luxury, dracula, cmyk, autumn, business, acid, lemonade, night, coffee, winter, dim, nord, sunset