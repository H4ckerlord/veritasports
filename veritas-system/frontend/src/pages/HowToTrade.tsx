import { useState } from 'react';

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

const exchangeByCountry: Record
  string,
  { name: string; url: string; steps: string[] }
> = {
  ng: {
    name: 'Bybit or Binance',
    url: 'https://www.bybit.com',
    steps: [
      'Go to bybit.com on your phone or computer',
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
      'Click Withdraw, choose US