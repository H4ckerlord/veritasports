import { useState } from 'react';

export default function HowToTrade() {
  const [open, setOpen] = useState<number | null>(1);
  const [country, setCountry] = useState('ng');

  function toggle(n: number) {
    setOpen(open === n ? null : n);
  }

  const exchangeSteps: { [k: string]: { name: string; url: string; steps: string[] } } = {
    ng: {
      name: 'Bybit or Binance',
      url: 'https://www.bybit.com',
      steps: [
        'Go to bybit.com on your phone or computer',
        'Click Sign Up and create a free account with your email',
        'Verify your identity by uploading your NIN or BVN and a selfie',
        'After verification click Deposit',
        'Choose Bank Transfer and select your Nigerian bank',
        'Transfer Naira from your bank to Bybit using the account details shown',
        'Once Naira arrives click Trade then Convert and convert your Naira to USDC',
        'Go to Withdraw and choose USDC',
        'Select Polygon network and paste your MetaMask wallet address',
        'Click Withdraw and USDC will arrive in MetaMask within 5 minutes',
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
        'Enter the amount you want to buy in dollars and confirm',
        'Once purchased click Send and enter your MetaMask wallet address',
        'Select Polygon as the network and click Send',
        'USDC will arrive in your MetaMask within a few minutes',
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
        'Click Buy and search for USDC then enter the amount in pounds',
        'Once purchased click Send and enter your MetaMask wallet address',
        'Select Polygon as the network and click Send',
        'USDC will arrive in your MetaMask within a few minutes',
      ],
    },
    gh: {
      name: 'Yellow Card or Binance',
      url: 'https://www.yellowcard.io',
      steps: [
        'Go to yellowcard.io or binance.com',
        'Click Sign Up and create a free account',
        'Verify your identity with your Ghana Card',
        'Deposit Ghana Cedis using mobile money or bank transfer',
        'Convert your Cedis to USDC on the platform',
        'Click Withdraw and choose USDC then select Polygon network',
        'Paste your MetaMask wallet address and confirm withdrawal',
        'USDC will arrive in your MetaMask within a few minutes',
      ],
    },
    ke: {
      name: 'Yellow Card or Binance',
      url: 'https://www.yellowcard.io',
      steps: [
        'Go to yellowcard.io or binance.com',
        'Click Sign Up and create a free account',
        'Verify your identity with your Kenyan ID',
        'Deposit Kenya Shillings using M-Pesa',
        'Convert your Shillings to USDC on the platform',
        'Click Withdraw and choose USDC then select Polygon network',
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
        'Click Withdraw and choose USDC then select Polygon network',
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
        'Click Withdraw and choose USDC then select Polygon network',
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
        'Select USDC as the coin you want to buy and complete the purchase',
        'Once you have USDC click Withdraw',
        'Choose USDC and select Polygon as the network',
        'Paste your MetaMask wallet address and confirm withdrawal',
        'USDC will arrive in your MetaMask within a few minutes',
      ],
    },
  };

  const ex = exchangeSteps[country] || exchangeSteps['other'];

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

  function Steps({ items }: { items: string[] }) {
    return (
      <ol className="space-y-2 list-none">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="shrink-0 w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs flex items-center justify-center font-bold">
              {i + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    );
  }

  function Card({ n, icon, title, children }: { n: number; icon: string; title: string; children: React.ReactNode }) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <button
          onClick={() => toggle(n)}
          className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
        >
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-2xl">
            {icon}
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold text-brand-500 block">STEP {n}</span>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          </div>
          <span className="text-gray-400 text-xl">{open === n ? '▲' : '▼'}</span>
        </button>
        {open === n && (
          <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="text-center space-y-3 py-6">
        <div className="text-5xl">📚</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          How to Trade on Veritas
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Complete beginner guide from zero to placing your first trade in under 30 minutes
        </p>
        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-4 text-sm text-brand-700 dark:text-brand-300">
          You do not need any experience with crypto. Just follow these steps one by one.
        </div>
      </div>

      <Card n={1} icon="🦊" title="Download MetaMask Wallet">
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <p>MetaMask is a free digital wallet that holds your USDC. Think of it like a bank account on your phone.</p>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="font-semibold text-red-700 dark:text-red-400 mb-1">Warning</p>
            <p className="text-xs text-red-600 dark:text-red-400">
              MetaMask will give you 12 secret words. Write them on paper. Never share them with anyone. Never type them on any website. If someone asks for your 12 words it is a scam.
            </p>
          </div>
          <p className="font-semibold text-gray-800 dark:text-gray-200">On your phone:</p>
          <Steps items={[
            'Open the App Store on iPhone or Google Play Store on Android',
            'Search for MetaMask and download the free app',
            'Open the app and tap Create a new wallet',
            'Create a strong password and write it down somewhere safe',
            'MetaMask shows you 12 random words which is your Secret Recovery Phrase',
            'Write these 12 words on paper in the correct order and keep them safe forever',
            'Confirm the 12 words when asked by tapping them in order',
            'Your wallet is now created',
          ]} />
          <p className="font-semibold text-gray-800 dark:text-gray-200">On your computer:</p>
          <Steps items={[
            'Open Google Chrome browser',
            'Go to metamask.io',
            'Click Download for Chrome then Add to Chrome',
            'MetaMask icon appears in your browser toolbar',
            'Click it and follow the same steps as above',
          ]} />
        </div>
      </Card>

      <Card n={2} icon="🔗" title="Add Polygon Network to MetaMask">
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <p>Polygon is the blockchain that Veritas runs on. You need to add it to MetaMask.</p>
          <Steps items={[
            'Open MetaMask app on your phone',
            'Tap the three lines menu at the top left corner',
            'Tap Settings then tap Networks',
            'Tap Add Network',
            'Fill in the details shown below exactly',
            'Tap Save and you are now on the Polygon network',
          ]} />
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 font-mono text-xs space-y-1">
            <p><span className="text-gray-400">Network Name: </span><span className="text-brand-600 dark:text-brand-400">Polygon</span></p>
            <p><span className="text-gray-400">RPC URL: </span><span className="text-brand-600 dark:text-brand-400">https://polygon-rpc.com</span></p>
            <p><span className="text-gray-400">Chain ID: </span><span className="text-brand-600 dark:text-brand-400">137</span></p>
            <p><span className="text-gray-400">Symbol: </span><span className="text-brand-600 dark:text-brand-400">MATIC</span></p>
            <p><span className="text-gray-400">Explorer: </span><span className="text-brand-600 dark:text-brand-400">https://polygonscan.com</span></p>
          </div>
        </div>
      </Card>

      <Card n={3} icon="💵" title="Buy USDC - Select Your Country">
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <p>USDC is a digital dollar. 1 USDC always equals 1 US Dollar. Select your country below.</p>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Your Country</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {countries.map((c) => (
              <button
                key={c.code}
                onClick={() => setCountry(c.code)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border-2 transition ${
                  country === c.code
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <span className="text-lg">{c.flag}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Recommended: {ex.name}</p>
              <a href={ex.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-500 hover:underline">
                Open website
              </a>
            </div>
            <Steps items={ex.steps} />
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <p className="font-semibold text-yellow-700 dark:text-yellow-400 text-sm mb-1">Always use Polygon network</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              When withdrawing USDC always select Polygon as the network. Using the wrong network means your money could be sent to the wrong place.
            </p>
          </div>
        </div>
      </Card>

      <Card n={4} icon="🔌" title="Connect MetaMask to Veritas">
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <p>Now that you have USDC in your MetaMask you are ready to connect to Veritas.</p>
          <p className="font-semibold text-gray-800 dark:text-gray-200">On your phone:</p>
          <Steps items={[
            'Open MetaMask app',
            'Tap the Browser icon at the bottom which looks like a globe',
            'Type the Veritas website address and press Enter',
            'The website opens inside MetaMask browser',
            'Tap Connect Wallet at the top right',
            'Tap Connect in the popup that appears',
            'Your wallet address shows at the top right and you are connected',
          ]} />
          <p className="font-semibold text-gray-800 dark:text-gray-200">On your computer:</p>
          <Steps items={[
            'Open Google Chrome and go to the Veritas website',
            'Click Connect Wallet at the top right corner',
            'MetaMask popup appears automatically',
            'Click Connect and your wallet address shows at the top right',
          ]} />
        </div>
      </Card>

      <Card n={5} icon="🏆" title="Place Your First Trade">
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <p>You are now ready to trade. Here is exactly how to place your first bet.</p>
          <Steps items={[
            'Click Markets in the top menu to see all available sport predictions',
            'Find a sport event you know about and read the question carefully',
            'Click the Trade button on that market',
            'A popup shows YES and NO with their odds',
            'If you think the answer is YES tap YES',
            'If you think the answer is NO tap NO',
            'The odds show for example 1.85x meaning 10 USDC bet could win 18.50 USDC',
            'Type the amount of USDC you want to bet and start small like 5 USDC',
            'You will see Potential Win showing how much you could receive',
            'Tap Confirm Bet',
            'MetaMask opens and the first approval is for USDC spending - tap Confirm',
            'The second approval is for the actual transaction - tap Confirm again',
            'Wait about 10 seconds for the transaction to complete',
            'A green message appears saying Bet placed successfully',
          ]} />
        </div>
      </Card>

      <Card n={6} icon="💰" title="Claim Your Winnings">
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <p>After the match ends and you predicted correctly here is how to collect your money.</p>
          <Steps items={[
            'Wait for the match to finish',
            'Azuro automatically checks the result within 1 to 2 hours',
            'Go to your Dashboard page on Veritas',
            'Click the link to Azuro and connect your wallet there',
            'You will see your bet marked as WIN',
            'Click the Claim button and confirm in MetaMask',
            'Your USDC winnings arrive in your MetaMask wallet within seconds',
            'To convert to your local currency send USDC back to your exchange and withdraw to bank',
          ]} />
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Your winnings never expire</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Your winnings are always safe in the smart contract. You can claim them today next week or next month.
            </p>
          </div>
        </div>
      </Card>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Common Questions</h2>
        {[
          { q: 'Is my money safe?', a: 'Yes. Your USDC is held in a smart contract on the blockchain. Nobody can touch it except you.' },
          { q: 'What is the minimum amount I can bet?', a: 'You can bet as little as 1 USDC. There is no maximum limit.' },
          { q: 'Can I cancel my bet after placing it?', a: 'Bets cannot be cancelled once confirmed on the blockchain. Always double check before confirming.' },
          { q: 'How long does it take to receive winnings?', a: 'The oracle resolves markets within 1 to 2 hours after the event ends. Once resolved you can claim instantly.' },
          { q: 'What if the match is cancelled?', a: 'If a match is cancelled Azuro will void the market and automatically refund everyone their money.' },
        ].map((faq) => (
          <div key={faq.q} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1">{faq.q}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl p-8 text-center text-white space-y-4">
        <p className="text-2xl font-bold">Ready to Start?</p>
        <p className="opacity-90">You now know everything. Go to Markets and place your first trade!</p>
        <a href="/markets" className="inline-block bg-white text-brand-600 font-bold px-8 py-3 rounded-xl hover:bg-brand-50 transition">
          Browse Markets
        </a>
      </div>

    </div>
  );
}