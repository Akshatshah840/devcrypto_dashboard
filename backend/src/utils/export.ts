import { ExportData, GitHubActivity, AirQualityData, CorrelationResult, ExportFormat } from '../types';

/**
 * Export utilities for serializing dashboard data to different formats
 * These functions handle exporting data with proper metadata and formatting
 */

/**
 * Create export data structure with metadata
 */
export function createExportData(
  city: string,
  period: number,
  format: ExportFormat,
  githubData: GitHubActivity[],
  airQualityData: AirQualityData[],
  correlationData?: CorrelationResult,
  dataSource: 'live' | 'mock' = 'live'
): ExportData {
  return {
    metadata: {
      city,
      period,
      exportFormat: format,
      generatedAt: new Date().toISOString(),
      dataSource
    },
    githubData,
    airQualityData,
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
  lines.push('# Export Metadata');
  lines.push(`# City: ${data.metadata.city}`);
  lines.push(`# Period: ${data.metadata.period} days`);
  lines.push(`# Generated: ${data.metadata.generatedAt}`);
  lines.push(`# Data Source: ${data.metadata.dataSource}`);
  lines.push('');
  
  // GitHub data section
  if (data.githubData.length > 0) {
    lines.push('# GitHub Activity Data');
    lines.push('date,city,commits,stars,repositories,contributors');
    data.githubData.forEach(item => {
      lines.push(`${item.date},${item.city},${item.commits},${item.stars},${item.repositories},${item.contributors}`);
    });
    lines.push('');
  }
  
  // Air quality data section
  if (data.airQualityData.length > 0) {
    lines.push('# Air Quality Data');
    lines.push('date,city,aqi,pm25,station,lat,lng');
    data.airQualityData.forEach(item => {
      lines.push(`${item.date},${item.city},${item.aqi},${item.pm25},${item.station},${item.coordinates.lat},${item.coordinates.lng}`);
    });
    lines.push('');
  }
  
  // Correlation data section
  if (data.correlationData) {
    lines.push('# Correlation Analysis');
    lines.push('metric,correlation_value');
    lines.push(`commits_aqi,${data.correlationData.correlations.commits_aqi}`);
    lines.push(`stars_aqi,${data.correlationData.correlations.stars_aqi}`);
    lines.push(`commits_pm25,${data.correlationData.correlations.commits_pm25}`);
    lines.push(`stars_pm25,${data.correlationData.correlations.stars_pm25}`);
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
    if (line.startsWith('# City: ')) {
      metadata.city = line.substring(8);
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
    githubData: [], // Would need full CSV parsing implementation
    airQualityData: [], // Would need full CSV parsing implementation
    correlationData: undefined
  };
}

/**
 * Generate export filename based on parameters
 */
export function generateExportFilename(
  city: string,
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
  
  // Sanitize city name by removing invalid filename characters
  const sanitizedCity = city.replace(/[/\\:*?"<>|]/g, '-').trim();
  
  return `github-air-quality-${sanitizedCity}-${period}days-${ts}.${format}`;
}