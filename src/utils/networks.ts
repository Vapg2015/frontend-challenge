/**
 * Networks supported by the wallet / checkout UI.
 * Static client-side catalogue (chain metadata does not come from the mocked API).
 */

import type { WalletNetwork } from '@/api/contracts';

export interface NetworkInfo {
  id: WalletNetwork;
  name: string;
  chainId: number;
  symbol: string;
  explorerUrl: string;
}

export const supportedNetworks: readonly NetworkInfo[] = [
  { id: 'ethereum', name: 'Ethereum', chainId: 1, symbol: 'ETH', explorerUrl: 'https://etherscan.io' },
  { id: 'polygon', name: 'Polygon', chainId: 137, symbol: 'MATIC', explorerUrl: 'https://polygonscan.com' },
  { id: 'arbitrum', name: 'Arbitrum', chainId: 42161, symbol: 'ETH', explorerUrl: 'https://arbiscan.io' },
  { id: 'optimism', name: 'Optimism', chainId: 10, symbol: 'ETH', explorerUrl: 'https://optimistic.etherscan.io' },
  { id: 'base', name: 'Base', chainId: 8453, symbol: 'ETH', explorerUrl: 'https://basescan.org' },
];
