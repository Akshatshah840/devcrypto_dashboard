/**
 * Mock Data Service for DevCrypto Analytics
 * Generates realistic mock data for development and testing
 */

import { GitHubActivity, CryptoData, CorrelationResult, TimePeriod } from '../types';

// Generate mock GitHub activity data
export const generateMockGitHubData = (days: TimePeriod): GitHubActivity[] => {
  const data: GitHubActivity[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Generate realistic patterns (more activity on weekdays)
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseMultiplier = isWeekend ? 0.6 : 1;

    // Add some randomness and trends
    const trend = Math.sin(i / 7) * 0.2 + 1;
    const randomFactor = 0.8 + Math.random() * 0.4;

    data.push({
      date: date.toISOString().split('T')[0],
      commits: Math.floor(15000 + Math.random() * 10000 * baseMultiplier * trend * randomFactor),
      pullRequests: Math.floor(3000 + Math.random() * 2000 * baseMultiplier * trend * randomFactor),
      issues: Math.floor(2000 + Math.random() * 1500 * baseMultiplier * trend * randomFactor),
      stars: Math.floor(5000 + Math.random() * 3000 * randomFactor),
      forks: Math.floor(1000 + Math.random() * 800 * randomFactor),
      contributors: Math.floor(8000 + Math.random() * 4000 * randomFactor),
    });
  }

  return data;
};

// Base prices for different coins (approximate)
const BASE_PRICES: Record<string, number> = {
  bitcoin: 95000,
  ethereum: 3500,
  solana: 180,
  cardano: 0.95,
  dogecoin: 0.35,
  ripple: 2.2,
  polkadot: 7.5,
  'avalanche-2': 40,
};

// Generate mock crypto price data
export const generateMockCryptoData = (coinId: string, days: TimePeriod): CryptoData[] => {
  const data: CryptoData[] = [];
  const now = new Date();
  const basePrice = BASE_PRICES[coinId] || 100;

  let currentPrice = basePrice;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Simulate price movement (random walk with slight upward bias)
    const priceChange = (Math.random() - 0.48) * basePrice * 0.05;
    currentPrice = Math.max(basePrice * 0.7, Math.min(basePrice * 1.3, currentPrice + priceChange));

    const volume = basePrice * 1000000000 * (0.8 + Math.random() * 0.4);
    const marketCap = currentPrice * (coinId === 'bitcoin' ? 19500000 :
                       coinId === 'ethereum' ? 120000000 :
                       coinId === 'solana' ? 430000000 :
                       coinId === 'dogecoin' ? 140000000 : 50000000);

    const priceChange24h = (Math.random() - 0.5) * basePrice * 0.1;
    const priceChangePercentage24h = (priceChange24h / currentPrice) * 100;

    data.push({
      date: date.toISOString().split('T')[0],
      coin: coinId,
      price: Math.round(currentPrice * 100) / 100,
      volume: Math.round(volume),
      marketCap: Math.round(marketCap),
      priceChange24h: Math.round(priceChange24h * 100) / 100,
      priceChangePercentage24h: Math.round(priceChangePercentage24h * 100) / 100,
    });
  }

  return data;
};

// Calculate correlation between two arrays
const calculateCorrelation = (x: number[], y: number[]): number => {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
  const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
  const sumXY = x.slice(0, n).reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.slice(0, n).reduce((total, xi) => total + xi * xi, 0);
  const sumY2 = y.slice(0, n).reduce((total, yi) => total + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
};

// Generate mock correlation result
export const generateMockCorrelation = (
  coinId: string,
  days: TimePeriod,
  githubData: GitHubActivity[],
  cryptoData: CryptoData[]
): CorrelationResult => {
  const commits = githubData.map(d => d.commits);
  const pullRequests = githubData.map(d => d.pullRequests);
  const stars = githubData.map(d => d.stars);
  const prices = cryptoData.map(d => d.price);
  const volumes = cryptoData.map(d => d.volume);

  const commits_price = calculateCorrelation(commits, prices);
  const commits_volume = calculateCorrelation(commits, volumes);
  const pullRequests_price = calculateCorrelation(pullRequests, prices);
  const stars_price = calculateCorrelation(stars, prices);

  // Generate interpretation based on strongest correlation
  const maxCorr = Math.max(
    Math.abs(commits_price),
    Math.abs(commits_volume),
    Math.abs(pullRequests_price),
    Math.abs(stars_price)
  );

  let interpretation = '';
  if (maxCorr < 0.3) {
    interpretation = 'Weak correlation: Developer activity and crypto prices appear largely independent.';
  } else if (maxCorr < 0.5) {
    interpretation = 'Moderate correlation: Some relationship exists between dev activity and crypto market.';
  } else if (maxCorr < 0.7) {
    interpretation = 'Notable correlation: Developer activity shows meaningful connection to crypto prices.';
  } else {
    interpretation = 'Strong correlation: Significant relationship between development trends and market movement.';
  }

  return {
    coin: coinId,
    period: days,
    correlations: {
      commits_price: Math.round(commits_price * 1000) / 1000,
      commits_volume: Math.round(commits_volume * 1000) / 1000,
      pullRequests_price: Math.round(pullRequests_price * 1000) / 1000,
      stars_price: Math.round(stars_price * 1000) / 1000,
    },
    interpretation,
    confidence: Math.round((0.7 + Math.random() * 0.25) * 100) / 100,
    dataPoints: Math.min(githubData.length, cryptoData.length),
  };
};

// Get current crypto stats (for dashboard cards)
export const getMockCryptoStats = (coinId: string) => {
  const basePrice = BASE_PRICES[coinId] || 100;
  const priceChange = (Math.random() - 0.5) * 10;

  return {
    price: basePrice * (1 + (Math.random() - 0.5) * 0.1),
    priceChange24h: priceChange,
    priceChangePercentage: priceChange,
    volume24h: basePrice * 1000000000 * (0.8 + Math.random() * 0.4),
    marketCap: basePrice * (coinId === 'bitcoin' ? 19500000 : 100000000),
    high24h: basePrice * 1.05,
    low24h: basePrice * 0.95,
  };
};

// Get current GitHub stats (for dashboard cards)
export const getMockGitHubStats = () => {
  return {
    totalCommits: Math.floor(150000 + Math.random() * 50000),
    totalPRs: Math.floor(35000 + Math.random() * 15000),
    totalIssues: Math.floor(25000 + Math.random() * 10000),
    activeRepos: Math.floor(80000 + Math.random() * 20000),
    contributors: Math.floor(100000 + Math.random() * 50000),
    trending: [
      { name: 'react', stars: 220000, language: 'JavaScript' },
      { name: 'tensorflow', stars: 180000, language: 'Python' },
      { name: 'rust', stars: 90000, language: 'Rust' },
    ],
  };
};
