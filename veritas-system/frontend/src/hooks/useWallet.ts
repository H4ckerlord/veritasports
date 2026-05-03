import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

export interface WalletState {
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: number | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToPolygon: (provider: ethers.BrowserProvider) => Promise<void>;
}

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function hasMetaMask(): boolean {
  return typeof window !== 'undefined' && !!(window as any).ethereum;
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    // On mobile without injected wallet — open MetaMask deep link
    if (isMobile() && !hasMetaMask()) {
      const currentUrl = encodeURIComponent(window.location.href);
      window.location.href = `https://metamask.app.link/dapp/${window.location.host}`;
      return;
    }

    if (!hasMetaMask()) {
      toast.error('MetaMask not found. Please install MetaMask to continue.');
      setTimeout(() => {
        window.open('https://metamask.io/download/', '_blank');
      }, 1500);
      return;
    }

    setConnecting(true);
    try {
      const _provider = new ethers.BrowserProvider(
        (window as any).ethereum as ethers.Eip1193Provider
      );
      await _provider.send('eth_requestAccounts', []);
      const _signer = await _provider.getSigner();
      const _address = await _signer.getAddress();
      const network = await _provider.getNetwork();
      const _chainId = Number(network.chainId);
      setProvider(_provider);
      setSigner(_signer);
      setAddress(_address);
      setChainId(_chainId);
      toast.success('Wallet connected!');
    } catch (err: any) {
      if (err?.code === 4001) {
        toast.error('Connection cancelled');
      } else {
        toast.error('Failed to connect wallet. Please try again.');
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    toast.success('Wallet disconnected');
  }, []);

  const switchToPolygon = useCallback(
    async (_provider: ethers.BrowserProvider) => {
      try {
        await _provider.send('wallet_switchEthereumChain', [
          { chainId: '0x13882' },
        ]);
      } catch {
        await _provider.send('wallet_addEthereumChain', [
          {
            chainId: '0x13882',
            chainName: 'Polygon Amoy Testnet',
            rpcUrls: ['https://rpc-amoy.polygon.technology'],
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
            blockExplorerUrls: ['https://amoy.polygonscan.com'],
          },
        ]);
      }
    },
    []
  );

  return {
    address,
    provider,
    signer,
    chainId,
    connecting,
    connect,
    disconnect,
    switchToPolygon,
  };
}

declare global {
  interface Window {
    ethereum?: unknown;
  }
}