import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { TECH_HUB_CITIES } from './data/cities';
import { dataService } from './services/dataService';
import {
  getCryptoData,
  getGitHubActivityForCrypto,
  getCryptoCorrelation,
  getCurrentCryptoPrice
} from './services/cryptoService';
import { TimePeriod } from './types';

// Supported cryptocurrencies
const SUPPORTED_COINS = [
  'bitcoin', 'ethereum', 'solana', 'cardano',
  'dogecoin', 'ripple', 'polkadot', 'avalanche-2'
];

const app = express();
const PORT = process.env.PORT || 5000;

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// CORS middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-domain.com'] // Replace with actual production domain
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit in development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api', limiter);

// Request validation middleware for common parameters
const validateCityParam = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { city } = req.params;
  if (city && !TECH_HUB_CITIES.find(c => c.id === city)) {
    return res.status(400).json({
      error: 'Invalid city parameter',
      message: `City '${city}' is not supported. Use one of: ${TECH_HUB_CITIES.map(c => c.id).join(', ')}`
    });
  }
  next();
};

const validateDaysParam = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { days } = req.params;
  if (days) {
    const daysNum = parseInt(days, 10);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 90) {
      return res.status(400).json({
        error: 'Invalid days parameter',
        message: 'Days must be a number between 1 and 90'
      });
    }
  }
  next();
};

const validateCoinParam = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { coinId } = req.params;
  if (coinId && !SUPPORTED_COINS.includes(coinId)) {
    return res.status(400).json({
      error: 'Invalid coin parameter',
      message: `Coin '${coinId}' is not supported. Use one of: ${SUPPORTED_COINS.join(', ')}`
    });
  }
  next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'DevCrypto Analytics API',
    supportedCoins: SUPPORTED_COINS
  });
});

// API Routes

// Cities endpoint - returns all supported tech hub cities
app.get('/api/cities', (req, res) => {
  try {
    res.json({
      success: true,
      data: TECH_HUB_CITIES,
      count: TECH_HUB_CITIES.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cities data',
      message: 'Internal server error'
    });
  }
});

// GitHub data endpoint
app.get('/api/github/:city/:days', validateCityParam, validateDaysParam, async (req, res) => {
  try {
    const { city, days } = req.params;
    const daysNum = parseInt(days, 10);
    
    console.log(`[API] Fetching GitHub data for ${city}, ${daysNum} days`);
    
    const result = await dataService.getGitHubData(city, daysNum);
    
    res.json({
      success: true,
      data: result.data,
      metadata: {
        city,
        days: daysNum,
        source: result.source,
        message: result.message,
        timestamp: new Date().toISOString(),
        recordCount: result.data.length
      },
      error: result.error
    });
    
  } catch (error) {
    console.error('GitHub endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GitHub data',
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// Air quality data endpoint
app.get('/api/airquality/:city/:days', validateCityParam, validateDaysParam, async (req, res) => {
  try {
    const { city, days } = req.params;
    const daysNum = parseInt(days, 10);
    
    console.log(`[API] Fetching air quality data for ${city}, ${daysNum} days`);
    
    const result = await dataService.getAirQualityData(city, daysNum);
    
    res.json({
      success: true,
      data: result.data,
      metadata: {
        city,
        days: daysNum,
        source: result.source,
        message: result.message,
        timestamp: new Date().toISOString(),
        recordCount: result.data.length
      },
      error: result.error
    });
    
  } catch (error) {
    console.error('Air quality endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch air quality data',
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// Correlation analysis endpoint
app.get('/api/correlation/:city/:days', validateCityParam, validateDaysParam, async (req, res) => {
  try {
    const { city, days } = req.params;
    const daysNum = parseInt(days, 10);

    console.log(`[API] Fetching correlation analysis for ${city}, ${daysNum} days`);

    const result = await dataService.getCorrelationAnalysis(city, daysNum);

    res.json({
      success: true,
      data: result.data,
      metadata: {
        city,
        days: daysNum,
        source: result.source,
        message: result.message,
        timestamp: new Date().toISOString(),
        dataPoints: result.data.correlation.dataPoints,
        confidence: result.data.correlation.confidence,
        hasSignificantCorrelations: result.data.significance.hasSignificantCorrelations
      },
      error: result.error
    });

  } catch (error) {
    console.error('Correlation endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate correlation analysis',
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== CRYPTO API ENDPOINTS ====================

// Supported coins list
app.get('/api/crypto/coins', (req, res) => {
  res.json({
    success: true,
    data: SUPPORTED_COINS,
    timestamp: new Date().toISOString()
  });
});

// Current crypto price
app.get('/api/crypto/price/:coinId', validateCoinParam, async (req, res) => {
  try {
    const { coinId } = req.params;
    console.log(`[API] Fetching current price for ${coinId}`);

    const priceData = await getCurrentCryptoPrice(coinId);

    res.json({
      success: true,
      data: priceData,
      source: 'live',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Crypto price endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch crypto price',
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// Historical crypto data
app.get('/api/crypto/:coinId/:days', validateCoinParam, validateDaysParam, async (req, res) => {
  try {
    const { coinId, days } = req.params;
    const daysNum = parseInt(days, 10) as TimePeriod;

    console.log(`[API] Fetching crypto data for ${coinId}, ${daysNum} days`);

    const cryptoData = await getCryptoData(coinId, daysNum);

    res.json({
      success: true,
      data: cryptoData,
      source: 'live',
      metadata: {
        coinId,
        days: daysNum,
        recordCount: cryptoData.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Crypto data endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch crypto data',
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// GitHub activity for crypto repositories
app.get('/api/crypto/github/:coinId/:days', validateCoinParam, validateDaysParam, async (req, res) => {
  try {
    const { coinId, days } = req.params;
    const daysNum = parseInt(days, 10) as TimePeriod;

    console.log(`[API] Fetching GitHub activity for ${coinId}, ${daysNum} days`);

    const githubData = await getGitHubActivityForCrypto(coinId, daysNum);

    res.json({
      success: true,
      data: githubData,
      source: 'live',
      metadata: {
        coinId,
        days: daysNum,
        recordCount: githubData.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Crypto GitHub endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GitHub activity',
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// Crypto correlation analysis
app.get('/api/crypto/correlation/:coinId/:days', validateCoinParam, validateDaysParam, async (req, res) => {
  try {
    const { coinId, days } = req.params;
    const daysNum = parseInt(days, 10) as TimePeriod;

    console.log(`[API] Fetching crypto correlation for ${coinId}, ${daysNum} days`);

    const correlationData = await getCryptoCorrelation(coinId, daysNum);

    res.json({
      success: true,
      data: correlationData,
      source: 'live',
      metadata: {
        coinId,
        days: daysNum,
        dataPoints: correlationData.dataPoints,
        confidence: correlationData.confidence,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Crypto correlation endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate crypto correlation',
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== END CRYPTO ENDPOINTS ====================

// Data export endpoint
app.get('/api/export/:format/:city/:days', validateCityParam, validateDaysParam, async (req, res) => {
  try {
    const { format, city, days } = req.params;
    const daysNum = parseInt(days, 10);
    
    // Validate export format
    if (format !== 'json' && format !== 'csv') {
      return res.status(400).json({
        success: false,
        error: 'Invalid export format',
        message: 'Format must be either "json" or "csv"'
      });
    }
    
    // Parse exclude parameters
    const excludeParams = req.query.exclude as string | string[] | undefined;
    const excludeTypes = Array.isArray(excludeParams) ? excludeParams : (excludeParams ? [excludeParams] : []);
    const includeGitHub = !excludeTypes.includes('github');
    const includeAirQuality = !excludeTypes.includes('airquality');
    const includeCorrelation = !excludeTypes.includes('correlation');
    
    console.log(`[API] Exporting data for ${city}, ${daysNum} days, format: ${format}, exclude: ${excludeTypes.join(',')}`);
    
    // Fetch only required data based on include flags
    const promises: Promise<any>[] = [];
    
    if (includeGitHub) {
      promises.push(dataService.getGitHubData(city, daysNum));
    } else {
      promises.push(Promise.resolve({ data: [], source: 'excluded' }));
    }
    
    if (includeAirQuality) {
      promises.push(dataService.getAirQualityData(city, daysNum));
    } else {
      promises.push(Promise.resolve({ data: [], source: 'excluded' }));
    }
    
    if (includeCorrelation && includeGitHub && includeAirQuality) {
      promises.push(dataService.getCorrelationAnalysis(city, daysNum));
    } else {
      promises.push(Promise.resolve({ data: { correlation: null }, source: 'excluded' }));
    }
    
    const [githubResult, airQualityResult, correlationResult] = await Promise.all(promises);
    
    // Determine overall data source
    const activeSources = [
      includeGitHub ? githubResult.source : null,
      includeAirQuality ? airQualityResult.source : null,
      includeCorrelation ? correlationResult.source : null
    ].filter(source => source && source !== 'excluded');
    
    const dataSource = activeSources.includes('mock') ? 'mock' : 'live';
    
    // Create export data structure
    const exportData: any = {
      metadata: {
        city,
        period: daysNum,
        exportFormat: format as 'json' | 'csv',
        generatedAt: new Date().toISOString(),
        dataSource,
        includedDataTypes: {
          github: includeGitHub,
          airQuality: includeAirQuality,
          correlation: includeCorrelation
        },
        dataSources: {
          github: githubResult.source,
          airQuality: airQualityResult.source,
          correlation: correlationResult.source
        }
      }
    };
    
    // Add data based on include flags
    if (includeGitHub) {
      exportData.githubData = githubResult.data;
    }
    if (includeAirQuality) {
      exportData.airQualityData = airQualityResult.data;
    }
    if (includeCorrelation) {
      exportData.correlationData = correlationResult.data.correlation;
    }
    
    // Generate filename
    const timestamp = new Date().toISOString();
    const sanitizedCity = city.replace(/[/\\:*?"<>|]/g, '-').trim();
    const dateStr = timestamp.replace(/[:.]/g, '-').split('T')[0];
    const filename = `github-air-quality-${sanitizedCity}-${daysNum}days-${dateStr}.${format}`;
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.json(exportData);
    } else {
      // CSV format
      res.setHeader('Content-Type', 'text/csv');
      
      const lines: string[] = [];
      
      // Add metadata header
      lines.push('# Export Metadata');
      lines.push(`# City: ${exportData.metadata.city}`);
      lines.push(`# Period: ${exportData.metadata.period} days`);
      lines.push(`# Generated: ${exportData.metadata.generatedAt}`);
      lines.push(`# Data Source: ${exportData.metadata.dataSource}`);
      lines.push('');
      
      // GitHub data section
      if (exportData.githubData && exportData.githubData.length > 0) {
        lines.push('# GitHub Activity Data');
        lines.push('date,city,commits,stars,repositories,contributors');
        exportData.githubData.forEach((item: any) => {
          lines.push(`${item.date},${item.city},${item.commits},${item.stars},${item.repositories},${item.contributors}`);
        });
        lines.push('');
      }
      
      // Air quality data section
      if (exportData.airQualityData && exportData.airQualityData.length > 0) {
        lines.push('# Air Quality Data');
        lines.push('date,city,aqi,pm25,station,lat,lng');
        exportData.airQualityData.forEach((item: any) => {
          lines.push(`${item.date},${item.city},${item.aqi},${item.pm25},${item.station},${item.coordinates.lat},${item.coordinates.lng}`);
        });
        lines.push('');
      }
      
      // Correlation data section
      if (exportData.correlationData) {
        lines.push('# Correlation Analysis');
        lines.push('metric,correlation_value');
        lines.push(`commits_aqi,${exportData.correlationData.correlations.commits_aqi}`);
        lines.push(`stars_aqi,${exportData.correlationData.correlations.stars_aqi}`);
        lines.push(`commits_pm25,${exportData.correlationData.correlations.commits_pm25}`);
        lines.push(`stars_pm25,${exportData.correlationData.correlations.stars_pm25}`);
        lines.push(`confidence,${exportData.correlationData.confidence}`);
        lines.push(`data_points,${exportData.correlationData.dataPoints}`);
      }
      
      res.send(lines.join('\n'));
    }
    
  } catch (error) {
    console.error('Export endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data',
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// Global error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error:`, err.stack);
  
  // Handle different types of errors
  let statusCode = 500;
  let message = 'Internal server error';
  
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Invalid request data';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized access';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
  }
  
  res.status(statusCode).json({
    success: false,
    error: message,
    message: process.env.NODE_ENV === 'development' ? err.message : message,
    timestamp: timestamp,
    path: req.path
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString()
  });
});

// Only start server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/api/health`);
  });
}

export default app;