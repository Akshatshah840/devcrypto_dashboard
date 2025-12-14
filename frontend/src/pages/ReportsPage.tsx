import React, { useState, useCallback, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExportFormat, TimePeriod, GitHubActivity, CryptoData, CorrelationResult } from '../types';
import { CRYPTO_COINS } from '../data/coins';

const API_BASE_URL = 'http://localhost:5000/api';

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
];

interface ExportRequest {
  id: string;
  coinId: string;
  period: TimePeriod;
  format: ExportFormat;
  timestamp: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
  data?: {
    cryptoData: CryptoData[];
    githubData: GitHubActivity[];
    correlationData: CorrelationResult | null;
  };
}

const ReportsPage: React.FC = () => {
  const [exportHistory, setExportHistory] = useState<ExportRequest[]>([]);
  const [currentExport, setCurrentExport] = useState<ExportRequest | null>(null);
  const [exportCoin, setExportCoin] = useState<string>('bitcoin');
  const [exportPeriod, setExportPeriod] = useState<TimePeriod>(30);

  const coinDropdownRef = useRef<HTMLDetailsElement>(null);
  const periodDropdownRef = useRef<HTMLDetailsElement>(null);

  const handleCoinDropdownToggle = () => {
    if (periodDropdownRef.current) periodDropdownRef.current.open = false;
  };

  const handlePeriodDropdownToggle = () => {
    if (coinDropdownRef.current) coinDropdownRef.current.open = false;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (coinDropdownRef.current && !coinDropdownRef.current.contains(target)) {
        coinDropdownRef.current.open = false;
      }
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(target)) {
        periodDropdownRef.current.open = false;
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const generateExportId = () => {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const generateMockData = (coinId: string, period: number) => {
    const cryptoData: CryptoData[] = [];
    const githubData: GitHubActivity[] = [];
    const now = new Date();

    for (let i = 0; i < period; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (period - 1 - i));
      const dateStr = date.toISOString().split('T')[0];

      cryptoData.push({
        date: dateStr,
        coin: coinId,
        price: 50000 + Math.random() * 10000,
        volume: 1000000000 + Math.random() * 500000000,
        marketCap: 900000000000 + Math.random() * 100000000000,
        priceChange24h: (Math.random() - 0.5) * 10,
        priceChangePercentage24h: (Math.random() - 0.5) * 10
      });

      githubData.push({
        date: dateStr,
        commits: Math.floor(Math.random() * 50) + 10,
        stars: Math.floor(Math.random() * 100) + 50,
        pullRequests: Math.floor(Math.random() * 20) + 5,
        issues: Math.floor(Math.random() * 15) + 3,
        forks: Math.floor(Math.random() * 10) + 2,
        contributors: Math.floor(Math.random() * 30) + 10
      });
    }

    const correlationData: CorrelationResult = {
      coin: coinId,
      period: period,
      correlations: {
        commits_price: (Math.random() - 0.5) * 2,
        commits_volume: (Math.random() - 0.5) * 2,
        pullRequests_price: (Math.random() - 0.5) * 2,
        stars_price: (Math.random() - 0.5) * 2
      },
      interpretation: 'Mock data - correlation analysis based on simulated data.',
      confidence: 0.75,
      dataPoints: period
    };

    return { cryptoData, githubData, correlationData };
  };

  const fetchExportData = async (coinId: string, period: TimePeriod) => {
    try {
      console.log('Fetching from API:', `${API_BASE_URL}/crypto/${coinId}/${period}`);

      const [cryptoRes, githubRes, correlationRes] = await Promise.all([
        fetch(`${API_BASE_URL}/crypto/${coinId}/${period}`)
          .then(r => r.ok ? r.json() : { success: false })
          .catch(() => ({ success: false })),
        fetch(`${API_BASE_URL}/crypto/github/${coinId}/${period}`)
          .then(r => r.ok ? r.json() : { success: false })
          .catch(() => ({ success: false })),
        fetch(`${API_BASE_URL}/crypto/correlation/${coinId}/${period}`)
          .then(r => r.ok ? r.json() : { success: false })
          .catch(() => ({ success: false }))
      ]);

      const cryptoData = cryptoRes.success && cryptoRes.data ? cryptoRes.data : [];
      const githubData = githubRes.success && githubRes.data ? githubRes.data : [];
      const correlationData = correlationRes.success && correlationRes.data ? correlationRes.data : null;

      console.log('API response:', {
        cryptoSuccess: cryptoRes.success,
        githubSuccess: githubRes.success,
        correlationSuccess: correlationRes.success
      });

      // If no data from API
      if (cryptoData.length === 0 && githubData.length === 0) {
        // In production, throw error instead of using mock data
        if (import.meta.env.PROD) {
          throw new Error('API is not responding. Please try again later or contact support.');
        }
        // In development, use mock data
        console.log('No data from API, using mock data');
        return generateMockData(coinId, period);
      }

      return { cryptoData, githubData, correlationData };
    } catch (error) {
      // In production, throw the error to show to user
      if (import.meta.env.PROD) {
        throw error;
      }

      // In development, fallback to mock data
      console.warn('API fetch failed, using mock data:', error);
      try {
        return generateMockData(coinId, period);
      } catch (mockError) {
        console.error('Mock data generation also failed:', mockError);
        throw new Error('Failed to fetch export data');
      }
    }
  };

  const generateCSV = (data: ExportRequest['data'], coinId: string, period: number): string => {
    if (!data) return '# No data available';

    const lines: string[] = [];
    const coinName = CRYPTO_COINS.find(c => c.id === coinId)?.name || coinId;

    lines.push('# DevCrypto Analytics Report');
    lines.push(`# Coin: ${coinName}`);
    lines.push(`# Period: ${period} days`);
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push('');

    // Crypto Price Data
    if (data.cryptoData && data.cryptoData.length > 0) {
      lines.push('# Cryptocurrency Price Data');
      lines.push('Date,Price (USD),Volume,Market Cap,24h Change (%)');
      data.cryptoData.forEach(item => {
        const price = item.price ?? 0;
        const volume = item.volume ?? 0;
        const marketCap = item.marketCap ?? 0;
        const change = item.priceChangePercentage24h ?? 0;
        lines.push(`${item.date || 'N/A'},${typeof price === 'number' ? price.toFixed(2) : price},${volume},${marketCap},${typeof change === 'number' ? change.toFixed(2) : change}`);
      });
      lines.push('');
    } else {
      lines.push('# No crypto price data available');
      lines.push('');
    }

    // GitHub Activity Data
    if (data.githubData && data.githubData.length > 0) {
      lines.push('# GitHub Activity Data');
      lines.push('Date,Commits,Stars,Pull Requests,Contributors');
      data.githubData.forEach(item => {
        lines.push(`${item.date || 'N/A'},${item.commits ?? 0},${item.stars ?? 0},${item.pullRequests ?? 0},${item.contributors ?? 0}`);
      });
      lines.push('');
    } else {
      lines.push('# No GitHub activity data available');
      lines.push('');
    }

    // Correlation Analysis
    if (data.correlationData && data.correlationData.correlations) {
      lines.push('# Correlation Analysis');
      lines.push('Metric,Value');
      const corr = data.correlationData.correlations;
      lines.push(`Commits vs Price,${typeof corr.commits_price === 'number' ? corr.commits_price.toFixed(4) : 'N/A'}`);
      lines.push(`Commits vs Volume,${typeof corr.commits_volume === 'number' ? corr.commits_volume.toFixed(4) : 'N/A'}`);
      lines.push(`Pull Requests vs Price,${typeof corr.pullRequests_price === 'number' ? corr.pullRequests_price.toFixed(4) : 'N/A'}`);
      lines.push(`Stars vs Price,${typeof corr.stars_price === 'number' ? corr.stars_price.toFixed(4) : 'N/A'}`);
      lines.push(`Confidence,${typeof data.correlationData.confidence === 'number' ? (data.correlationData.confidence * 100).toFixed(1) : 'N/A'}%`);
      lines.push(`Data Points,${data.correlationData.dataPoints ?? 'N/A'}`);
    } else {
      lines.push('# No correlation data available');
    }

    return lines.join('\n');
  };

  const generatePDF = (data: ExportRequest['data'], coinId: string, period: number): jsPDF => {
    const doc = new jsPDF();
    const coinName = CRYPTO_COINS.find(c => c.id === coinId)?.name || coinId;
    const coinSymbol = CRYPTO_COINS.find(c => c.id === coinId)?.symbol || '';

    try {
      // Title
      doc.setFontSize(20);
      doc.setTextColor(41, 128, 185);
      doc.text('DevCrypto Analytics Report', 105, 20, { align: 'center' });

      // Subtitle
      doc.setFontSize(14);
      doc.setTextColor(100);
      doc.text(`${coinName} (${coinSymbol}) - ${period} Day Analysis`, 105, 30, { align: 'center' });

      // Generated date
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 38, { align: 'center' });

      let yPos = 50;

      // Summary Stats
      if (data?.cryptoData && data.cryptoData.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Price Summary', 14, yPos);
        yPos += 8;

        const latestPrice = data.cryptoData[data.cryptoData.length - 1];
        const firstPrice = data.cryptoData[0];
        const priceChange = latestPrice && firstPrice && firstPrice.price ?
          ((latestPrice.price - firstPrice.price) / firstPrice.price * 100).toFixed(2) : '0';

        doc.setFontSize(10);
        doc.setTextColor(60);
        doc.text(`Current Price: $${latestPrice?.price?.toLocaleString() || 'N/A'}`, 14, yPos);
        yPos += 6;
        doc.text(`${period}-Day Change: ${priceChange}%`, 14, yPos);
        yPos += 6;
        const avgVolume = data.cryptoData.reduce((a, b) => a + (b.volume || 0), 0) / data.cryptoData.length;
        doc.text(`Average Volume: $${avgVolume.toLocaleString()}`, 14, yPos);
        yPos += 15;
      }

      // Crypto Data Table
      if (data?.cryptoData && data.cryptoData.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Price Data (${period} Days)`, 14, yPos);
        yPos += 5;

        const cryptoTableData = data.cryptoData.map(item => [
          item.date || 'N/A',
          `$${(item.price ?? 0).toFixed(2)}`,
          `$${((item.volume ?? 0) / 1e9).toFixed(2)}B`,
          `${(item.priceChangePercentage24h ?? 0).toFixed(2)}%`
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Price', 'Volume', '24h Change']],
          body: cryptoTableData,
          theme: 'striped',
          headStyles: { fillColor: [41, 128, 185] },
          margin: { left: 14, right: 14 },
        });

        yPos = (doc as any).lastAutoTable?.finalY ?? yPos + 50;
        yPos += 15;
      }

      // GitHub Activity Table
      if (data?.githubData && data.githubData.length > 0) {
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`GitHub Activity (${period} Days)`, 14, yPos);
        yPos += 5;

        const githubTableData = data.githubData.map(item => [
          item.date || 'N/A',
          String(item.commits ?? 0),
          String(item.stars ?? 0),
          String(item.pullRequests ?? 0),
          String(item.contributors ?? 0)
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Commits', 'Stars', 'PRs', 'Contributors']],
          body: githubTableData,
          theme: 'striped',
          headStyles: { fillColor: [46, 204, 113] },
          margin: { left: 14, right: 14 },
        });

        yPos = (doc as any).lastAutoTable?.finalY ?? yPos + 50;
        yPos += 15;
      }

      // Correlation Analysis
      if (data?.correlationData) {
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('Correlation Analysis', 14, yPos);
        yPos += 5;

        const corr = data.correlationData.correlations;
        const correlationTableData = [
          ['Commits vs Price', corr?.commits_price?.toFixed(4) ?? 'N/A'],
          ['Commits vs Volume', corr?.commits_volume?.toFixed(4) ?? 'N/A'],
          ['Pull Requests vs Price', corr?.pullRequests_price?.toFixed(4) ?? 'N/A'],
          ['Stars vs Price', corr?.stars_price?.toFixed(4) ?? 'N/A'],
          ['Confidence Level', `${((data.correlationData.confidence ?? 0) * 100).toFixed(1)}%`],
          ['Data Points', String(data.correlationData.dataPoints ?? 0)]
        ];

        autoTable(doc, {
          startY: yPos,
          head: [['Metric', 'Value']],
          body: correlationTableData,
          theme: 'striped',
          headStyles: { fillColor: [155, 89, 182] },
          margin: { left: 14, right: 14 },
        });

        yPos = (doc as any).lastAutoTable?.finalY ?? yPos + 50;
        yPos += 10;

        // Interpretation
        if (data.correlationData.interpretation) {
          doc.setFontSize(10);
          doc.setTextColor(80);
          const splitText = doc.splitTextToSize(`Interpretation: ${data.correlationData.interpretation}`, 180);
          doc.text(splitText, 14, yPos);
        }
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`DevCrypto Analytics - Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      }
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      // Create a simple fallback PDF
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text('DevCrypto Analytics Report', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Coin: ${coinName}`, 20, 40);
      doc.text(`Period: ${period} days`, 20, 50);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 60);
      doc.text('Data export completed. See CSV for full details.', 20, 80);
    }

    return doc;
  };

  const handleExport = useCallback(async (format: ExportFormat, customCoin?: string, customPeriod?: TimePeriod) => {
    const coinToExport = customCoin || exportCoin;
    const periodToExport = customPeriod || exportPeriod;

    console.log('Starting export:', { format, coinToExport, periodToExport });

    const exportRequest: ExportRequest = {
      id: generateExportId(),
      coinId: coinToExport,
      period: periodToExport,
      format,
      timestamp: new Date().toISOString(),
      status: 'pending',
      progress: 0
    };

    setExportHistory(prev => [exportRequest, ...prev]);
    setCurrentExport(exportRequest);

    try {
      // Update status to in-progress
      setExportHistory(prev => prev.map(exp =>
        exp.id === exportRequest.id ? { ...exp, status: 'in-progress', progress: 20 } : exp
      ));
      setCurrentExport(prev => prev?.id === exportRequest.id ? { ...prev, status: 'in-progress', progress: 20 } : prev);

      // Fetch data from API
      console.log('Fetching data...');
      const data = await fetchExportData(coinToExport, periodToExport);
      console.log('Data fetched:', {
        cryptoCount: data?.cryptoData?.length ?? 0,
        githubCount: data?.githubData?.length ?? 0,
        hasCorrelation: !!data?.correlationData
      });

      // Update progress
      setExportHistory(prev => prev.map(exp =>
        exp.id === exportRequest.id ? { ...exp, progress: 60 } : exp
      ));
      setCurrentExport(prev => prev?.id === exportRequest.id ? { ...prev, progress: 60 } : prev);

      // Generate file
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `devcrypto-${coinToExport}-${periodToExport}days-${dateStr}`;

      console.log('Generating', format, 'file...');

      try {
        if (format === 'csv') {
          const csvContent = generateCSV(data, coinToExport, periodToExport);
          console.log('CSV generated, length:', csvContent.length);
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);

          // Auto download
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log('CSV download triggered');
        } else if (format === 'pdf') {
          const doc = generatePDF(data, coinToExport, periodToExport);
          console.log('PDF generated, saving...');
          doc.save(`${filename}.pdf`);
          console.log('PDF download triggered');
        }
      } catch (fileError) {
        console.error('File generation error:', fileError);
        // Ultimate fallback: create a simple text file
        const fallbackContent = `DevCrypto Analytics Report\nCoin: ${coinToExport}\nPeriod: ${periodToExport} days\nGenerated: ${new Date().toISOString()}\n\nError generating ${format.toUpperCase()} file. Please try again.`;
        const blob = new Blob([fallbackContent], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('Fallback TXT download triggered');
      }

      // Mark as completed
      setExportHistory(prev => prev.map(exp =>
        exp.id === exportRequest.id ? {
          ...exp,
          status: 'completed',
          progress: 100,
          data
        } : exp
      ));
      setCurrentExport(null);
      console.log('Export completed successfully');

    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      console.error('Error details:', errorMessage);
      setExportHistory(prev => prev.map(exp =>
        exp.id === exportRequest.id ? {
          ...exp,
          status: 'failed',
          error: errorMessage
        } : exp
      ));
      setCurrentExport(null);
    }
  }, [exportCoin, exportPeriod]);

  const handleRedownload = useCallback((exportReq: ExportRequest) => {
    if (exportReq.data) {
      const dateStr = new Date(exportReq.timestamp).toISOString().split('T')[0];
      const filename = `devcrypto-${exportReq.coinId}-${exportReq.period}days-${dateStr}`;

      if (exportReq.format === 'csv') {
        const csvContent = generateCSV(exportReq.data, exportReq.coinId, exportReq.period);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (exportReq.format === 'pdf') {
        const doc = generatePDF(exportReq.data, exportReq.coinId, exportReq.period);
        doc.save(`${filename}.pdf`);
      }
    }
  }, []);

  const clearHistory = useCallback(() => {
    setExportHistory([]);
  }, []);

  const cancelExport = useCallback(() => {
    if (currentExport) {
      setExportHistory(prev => prev.map(exp =>
        exp.id === currentExport.id ? { ...exp, status: 'failed', error: 'Cancelled by user' } : exp
      ));
      setCurrentExport(null);
    }
  }, [currentExport]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Export */}
      <div className="glass-card rounded-xl p-4 relative z-20">
        <h3 className="text-sm font-semibold text-base-content mb-4">Export Data</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
          {/* Coin Dropdown */}
          <div className="relative">
            <details ref={coinDropdownRef} className="dropdown w-full">
              <summary
                className="btn btn-sm w-full justify-between bg-base-200 border-base-300 hover:bg-base-300 font-normal"
                onClick={handleCoinDropdownToggle}
              >
                <span className="truncate">
                  {CRYPTO_COINS.find(c => c.id === exportCoin)?.name || 'Select Coin'}
                </span>
                <svg className="w-4 h-4 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </summary>
              <ul className="dropdown-content absolute left-0 z-[100] mt-1 p-2 shadow-xl bg-base-100/90 backdrop-blur-lg rounded-xl border border-base-200/50 w-full max-h-60 overflow-y-auto">
              {CRYPTO_COINS.map((coin) => (
                <li key={coin.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setExportCoin(coin.id);
                      if (coinDropdownRef.current) coinDropdownRef.current.open = false;
                    }}
                    className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-left text-sm transition-colors ${
                      exportCoin === coin.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-base-300 text-base-content'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: coin.color }} />
                    <span className="flex-1">{coin.name} ({coin.symbol})</span>
                    {exportCoin === coin.id && (
                      <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
              </ul>
            </details>
          </div>

          {/* Period Dropdown */}
          <div className="relative">
            <details ref={periodDropdownRef} className="dropdown w-full">
              <summary
                className="btn btn-sm w-full justify-between bg-base-200 border-base-300 hover:bg-base-300 font-normal"
                onClick={handlePeriodDropdownToggle}
              >
                <span>{TIME_PERIODS.find(p => p.value === exportPeriod)?.label || '30 days'}</span>
                <svg className="w-4 h-4 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </summary>
              <ul className="dropdown-content absolute left-0 z-[100] mt-1 p-2 shadow-xl bg-base-100/90 backdrop-blur-lg rounded-xl border border-base-200/50 w-full">
                {TIME_PERIODS.map((period) => (
                  <li key={period.value}>
                    <button
                      type="button"
                      onClick={() => {
                        setExportPeriod(period.value);
                        if (periodDropdownRef.current) periodDropdownRef.current.open = false;
                      }}
                      className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-left text-sm transition-colors ${
                        exportPeriod === period.value
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-base-300 text-base-content'
                      }`}
                    >
                      <span className="flex-1">{period.label}</span>
                      {exportPeriod === period.value && (
                        <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          </div>

          {/* Export Buttons - CSV and PDF only */}
          <div className="flex gap-2">
            <button
              className="btn btn-primary btn-sm flex-1"
              onClick={() => handleExport('csv', exportCoin, exportPeriod)}
              disabled={!!currentExport}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>
            <button
              className="btn btn-secondary btn-sm flex-1"
              onClick={() => handleExport('pdf', exportCoin, exportPeriod)}
              disabled={!!currentExport}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Current Export Progress */}
      {currentExport && (
        <div className="glass-card rounded-xl p-4 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">
              Exporting {CRYPTO_COINS.find(c => c.id === currentExport.coinId)?.name || currentExport.coinId} ({currentExport.format.toUpperCase()})
            </span>
            <button className="btn btn-xs btn-ghost text-error" onClick={cancelExport}>
              Cancel
            </button>
          </div>
          <div className="flex items-center gap-3">
            <progress
              className="progress progress-primary flex-1"
              value={currentExport.progress}
              max="100"
            />
            <span className="text-xs font-medium w-10 text-right">{Math.round(currentExport.progress)}%</span>
          </div>
        </div>
      )}

      {/* Export History */}
      <div className="glass-card rounded-xl p-4 relative z-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-base-content">History</h3>
          {exportHistory.length > 0 && (
            <button className="btn btn-xs btn-ghost" onClick={clearHistory}>
              Clear
            </button>
          )}
        </div>

        {exportHistory.length === 0 ? (
          <div className="text-center py-8 text-base-content/40 text-sm">
            No exports yet
          </div>
        ) : (
          <div className="space-y-2">
            {exportHistory.map((exportReq) => (
              <div key={exportReq.id} className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`badge badge-sm ${exportReq.format === 'pdf' ? 'badge-secondary' : 'badge-primary'}`}>
                    {exportReq.format.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium">
                    {CRYPTO_COINS.find(c => c.id === exportReq.coinId)?.name || exportReq.coinId}
                  </span>
                  <span className="text-xs text-base-content/50">
                    {exportReq.period}d
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {exportReq.status === 'completed' && (
                    <span className="badge badge-success badge-sm">Done</span>
                  )}
                  {exportReq.status === 'failed' && (
                    <span className="badge badge-error badge-sm">Failed</span>
                  )}
                  {exportReq.status === 'in-progress' && (
                    <span className="badge badge-warning badge-sm">{Math.round(exportReq.progress)}%</span>
                  )}
                  {exportReq.status === 'pending' && (
                    <span className="badge badge-info badge-sm">Pending</span>
                  )}

                  {exportReq.status === 'completed' && exportReq.data && (
                    <button
                      className="btn btn-xs btn-primary"
                      onClick={() => handleRedownload(exportReq)}
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
