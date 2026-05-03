import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

export interface WalletState {
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: number | null;
  connecting: boolean;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    provider: null,
    signer: null,
    chainId: null,
    connecting: false,
  });

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not found. Please install it first.');
      return;
    }

    setState((s) => ({ ...s, connecting: true }));
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      setState({ address, provider, signer, chainId, connecting: false });
    } catch (err) {
      toast.error('Failed to connect wallet');
      setState((s) => ({ ...s, connecting: false }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ address: null, provider: null, signer: null, chainId: null, connecting: false });
  }, []);

  const switchToPolygon = useCallback(async (provider: ethers.BrowserProvider) => {
    try {
      await provider.send('wallet_switchEthereumChain', [
        { chainId: '0x13882' }, // 80002 = Polygon Amoy testnet
      ]);
    } catch {
      // Chain not added – add it
      await provider.send('wallet_addEthereumChain', [
        {
          chainId: '0x13882',
          chainName: 'Polygon Amoy Testnet',
          rpcUrls: ['https://rpc-amoy.polygon.technology'],
          nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
          blockExplorerUrls: ['https://amoy.polygonscan.com'],
        },
      ]);
    }
  }, []);

  return { ...state, connect, disconnect, switchToPolygon };
}

// Extend window for MetaMask
declare global {
  interface Window {
    ethereum?: unknown;
  }
}
