/**
 * Supported Cryptocurrencies for DevCrypto Analytics
 */

export interface CryptoCoin {
  id: string;
  symbol: string;
  name: string;
  color: string;
}

export const CRYPTO_COINS: CryptoCoin[] = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    color: '#F7931A',
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    color: '#627EEA',
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    color: '#00FFA3',
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    color: '#3CC8C8',
  },
  {
    id: 'dogecoin',
    symbol: 'DOGE',
    name: 'Dogecoin',
    color: '#C2A633',
  },
  {
    id: 'ripple',
    symbol: 'XRP',
    name: 'XRP',
    color: '#00AAE4',
  },
  {
    id: 'polkadot',
    symbol: 'DOT',
    name: 'Polkadot',
    color: '#E6007A',
  },
  {
    id: 'avalanche-2',
    symbol: 'AVAX',
    name: 'Avalanche',
    color: '#E84142',
  },
];

export const DEFAULT_COIN = 'bitcoin';

export const getCoinById = (id: string): CryptoCoin | undefined => {
  return CRYPTO_COINS.find(coin => coin.id === id);
};

export const getCoinColor = (id: string): string => {
  const coin = getCoinById(id);
  return coin?.color || '#888888';
};
