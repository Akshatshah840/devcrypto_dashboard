import { ExportData, GitHubActivity, CryptoData, CryptoCorrelationResult, ExportFormat } from '../types';

/**
 * Export utilities for serializing dashboard data to different formats
 * These functions handle exporting crypto data with proper metadata and formatting
 */

/**
 * Create export data structure with metadata
 */
export function createExportData(
  coinId: string,
  period: number,
  format: ExportFormat,
  githubData: GitHubActivity[],
  cryptoData: CryptoData[],
  correlationData?: CryptoCorrelationResult,
  dataSource: 'live' | 'mock' = 'live'
): ExportData {
  return {
    metadata: {
      coinId,
      period,
      exportFormat: format,
      generatedAt: new Date().toISOString(),
      dataSource
    },
    githubData,
    cryptoData,
    correlationData
  };
}

/**
 * Serialize export data to JSON string
 */
export function serializeExportDataToJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Parse JSON string to export data
 */
export function parseExportDataFromJSON(json: string): ExportData {
  return JSON.parse(json);
}

/**
 * Serialize export data to CSV format
 */
export function serializeExportDataToCSV(data: ExportData): string {
  const lines: string[] = [];

  // Add metadata header
  lines.push('# DevCrypto Export');
  lines.push(`# Coin: ${data.metadata.coinId}`);
  lines.push(`# Period: ${data.metadata.period} days`);
  lines.push(`# Generated: ${data.metadata.generatedAt}`);
  lines.push(`# Data Source: ${data.metadata.dataSource}`);
  lines.push('');

  // Crypto data section
  if (data.cryptoData && data.cryptoData.length > 0) {
    lines.push('# Cryptocurrency Price Data');
    lines.push('date,coinId,price,volume,marketCap,priceChangePercentage24h');
    data.cryptoData.forEach(item => {
      lines.push(`${item.date},${item.coinId},${item.price},${item.volume},${item.marketCap},${item.priceChangePercentage24h}`);
    });
    lines.push('');
  }

  // GitHub data section
  if (data.githubData && data.githubData.length > 0) {
    lines.push('# GitHub Activity Data');
    lines.push('date,commits,stars,contributors');
    data.githubData.forEach(item => {
      lines.push(`${item.date},${item.commits},${item.stars},${item.contributors}`);
    });
    lines.push('');
  }

  // Correlation data section
  if (data.correlationData) {
    lines.push('# Correlation Analysis');
    lines.push('metric,correlation_value');
    lines.push(`commits_price,${data.correlationData.correlations.commits_price}`);
    lines.push(`commits_volume,${data.correlationData.correlations.commits_volume}`);
    lines.push(`pullRequests_price,${data.correlationData.correlations.pullRequests_price}`);
    lines.push(`stars_price,${data.correlationData.correlations.stars_price}`);
    lines.push(`confidence,${data.correlationData.confidence}`);
    lines.push(`data_points,${data.correlationData.dataPoints}`);
  }

  return lines.join('\n');
}

/**
 * Parse CSV string back to export data (simplified - metadata only)
 * Note: Full CSV parsing would be complex due to the mixed format
 */
export function parseExportDataFromCSV(csv: string): Partial<ExportData> {
  const lines = csv.split('\n');
  const metadata: any = {};

  // Extract metadata from comments
  lines.forEach(line => {
    if (line.startsWith('# Coin: ')) {
      metadata.coinId = line.substring(8);
    } else if (line.startsWith('# Period: ')) {
      const match = line.match(/# Period: (\d+) days/);
      if (match) {
        metadata.period = parseInt(match[1], 10);
      }
    } else if (line.startsWith('# Generated: ')) {
      metadata.generatedAt = line.substring(13);
    } else if (line.startsWith('# Data Source: ')) {
      metadata.dataSource = line.substring(15) as 'live' | 'mock';
    }
  });

  return {
    metadata: {
      ...metadata,
      exportFormat: 'csv' as ExportFormat
    },
    githubData: [],
    cryptoData: [],
    correlationData: undefined
  };
}

/**
 * Generate export filename based on parameters
 */
export function generateExportFilename(
  coinId: string,
  period: number,
  format: ExportFormat,
  timestamp?: string
): string {
  let ts: string;
  if (timestamp) {
    // Sanitize timestamp by removing invalid filename characters
    ts = timestamp.replace(/[:.]/g, '-').split('T')[0];
  } else {
    ts = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  }

  return `devcrypto-${coinId}-${period}days-${ts}.${format}`;
}
