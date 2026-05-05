import { useState } from 'react';
import { useI18n } from '../App';

const countries = [
  { code: 'ng', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'us', name: 'United States', flag: '🇺🇸' },
  { code: 'gb', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'gh', name: 'Ghana', flag: '🇬🇭' },
  { code: 'ke', name: 'Kenya', flag: '🇰🇪' },
  { code: 'za', name: 'South Africa', flag: '🇿🇦' },
  { code: 'in', name: 'India', flag: '🇮🇳' },
  { code: 'other', name: 'Other Country', flag: '🌍' },
];

const exchangeByCountry: Record<string, { name: string; url: string; steps: string[] }> = {
  ng: {
    name: 'Bybit or Binance',
    url: 'https://www.bybit.com',
    steps: [
      'Go to bybit.com or binance.com on your phone or computer',
      'Click Sign Up and create a free account with your email',
      'Verify your identity by uploading your NIN or BVN and a selfie',
      'After verification is approved (usually 10 minutes), click Deposit',
      'Choose Bank Transfer and select your Nigerian bank',
      'Transfer Naira from your bank account to Bybit using the account details shown',
      'Once Naira arrives in Bybit, click Trade then Convert',
      'Convert your Naira to USDC',
      'Now go to Withdraw, choose USDC, select Polygon network, and paste your MetaMask wallet address',
      'Click Withdraw — USDC will arrive in your MetaMask within 5 minutes',
    ],
  },
  us: {
    name: 'Coinbase',
    url: 'https://www.coinbase.com',
    steps: [
      'Go to coinbase.com or download the Coinbase app',
      'Click Sign Up and create a free account with your email',
      'Verify your identity with your driver license or passport',
      'Click Add Payment Method and connect your US bank account or debit card',
      'Click Buy and search for USDC',
      'Enter the amount of USDC you want to buy in dollars',
      'Click Buy USDC and confirm',
      'Once purchased, click Send and enter your MetaMask wallet address',
      'Select Polygon as the network',
      'Click Send — USDC will arrive in your MetaMask within a few minutes',
    ],
  },
  gb: {
    name: 'Coinbase or Kraken',
    url: 'https://www.coinbase.com',
    steps: [
      'Go to coinbase.com or kraken.com',
      'Click Sign Up and create a free account with your email',
      'Verify your identity with your passport or driving licence',
      'Click Add Payment Method and connect your UK bank account',
      'Use Faster Payments to deposit British Pounds instantly',
      'Click Buy and search for USDC',
      'Enter the amount you want to buy in pounds',
      'Click Buy USDC and confirm',
      'Once purchased, click Send and enter your MetaMask wallet address',
      'Select Polygon as the network',
      'Click Send — USDC will arrive in your MetaMask within a few minutes',
    ],
  },
  gh: {
    name: 'Binance or Yellow Card',
    url: 'https://www.yellowcard.io',
    steps: [
      'Go to yellowcard.io or binance.com',
      'Click Sign Up and create a free account',
      'Verify your identity with your Ghana Card',
      'Deposit Ghana Cedis using mobile money or bank transfer',
      'Convert your Cedis to USDC on the platform',
      'Click Withdraw, choose USDC, select Polygon network',
      'Paste your MetaMask wallet address and confirm withdrawal',
      'USDC will arrive in your MetaMask within a few minutes',
    ],
  },
  ke: {
    name: 'Binance or Yellow Card',
    url: 'https://www.yellowcard.io',
    steps: [
      'Go to yellowcard.io or binance.com',
      'Click Sign Up and create a free account',
      'Verify your identity with your Kenyan ID',
      'Deposit Kenya Shillings using M-Pesa mobile money',
      'Convert your Shillings to USDC on the platform',
      'Click Withdraw, choose USDC, select Polygon network',
      'Paste your MetaMask wallet address and confirm withdrawal',
      'USDC will arrive in your MetaMask within a few minutes',
    ],
  },
  za: {
    name: 'Luno or Binance',
    url: 'https://www.luno.com',
    steps: [
      'Go to luno.com or binance.com',
      'Click Sign Up and create a free account',
      'Verify your identity with your South African ID',
      'Deposit South African Rand using bank EFT transfer',
      'Convert your Rand to USDC on the platform',
      'Click Withdraw, choose USDC, select Polygon network',
      'Paste your MetaMask wallet address and confirm withdrawal',
      'USDC will arrive in your MetaMask within a few minutes',
    ],
  },
  in: {
    name: 'CoinDCX or WazirX',
    url: 'https://coindcx.com',
    steps: [
      'Go to coindcx.com or wazirx.com',
      'Click Sign Up and create a free account',
      'Verify your identity with your Aadhaar card or PAN card',
      'Deposit Indian Rupees using UPI or bank transfer',
      'Convert your Rupees to USDC on the platform',
      'Click Withdraw, choose USDC, select Polygon network',
      'Paste your MetaMask wallet address and confirm withdrawal',
      'USDC will arrive in your MetaMask within a few minutes',
    ],
  },
  other: {
    name: 'Binance',
    url: 'https://www.binance.com',
    steps: [
      'Go to binance.com on your phone or computer',
      'Click Sign Up and create a free account with your email',
      'Verify your identity with your national ID or passport',
      'Click Buy Crypto and choose your local payment method',
      'Select USDC as the coin you want to buy',
      'Enter the amount you want to buy in your local currency',
      'Complete the purchase following the on-screen instructions',
      'Once you have USDC, click Withdraw',
      'Choose USDC, select Polygon as the network',
      'Paste your MetaMask wallet address and confirm withdrawal',
      'USDC will arrive in your MetaMask within a few minutes',
    ],
  },
};

const steps = [
  {
    number: 1,
    title: 'Download MetaMask Wallet',
    icon: '🦊',
    content: (
      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
        <p>MetaMask is a free digital wallet that holds your USDC and connects to trading platforms. Think of it like a bank account but on your phone or computer.</p>
        <div className="space-y-2">
          <p className="font-semibold text-gray-800 dark:text-gray-200">On your phone:</p>
          <ol className="space-y-1 list-none">
            {[
              'Open the App Store (iPhone) or Google Play Store (Android)',
              'Search for "MetaMask"',
              'Download and install the app — it is free',
              'Open the app and tap "Create a new wallet"',
              'Create a strong password and write it down somewhere safe',
              'MetaMask will show you 12 random words — this is your Secret Recovery Phrase',
              'Write these 12 words on paper in the correct order — NEVER share them with anyone',
              'Keep this paper somewhere very safe — if you lose it you lose all your money',
              'Confirm the 12 words when asked — tap them in the correct order',
              'Your wallet is now created',
            ].map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="font-semibold text-red-700 dark:text-red-400 mb-1">⚠️ Very Important Warning</p>
          <p className="text-red-600 dark:text-red-400">Never share your 12 words with anyone. Nobody from this platform, MetaMask, or any website will ever ask for your 12 words. If someone asks — it is a scam.</p>
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-gray-800 dark:text-gray-200">On your computer:</p>
          <ol className="space-y-1 list-none">
            {[
              'Open Google Chrome browser',
              'Go to metamask.io',
              'Click "Download for Chrome"',
              'Click "Add to Chrome" then "Add Extension"',
              'MetaMask icon appears in your browser toolbar',
              'Click it and follow the same steps as phone above',
            ].map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <span>{step}</span>