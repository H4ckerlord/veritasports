export default function TermsOfService() {
  const sections = [
    {
      title: 'Introduction',
      body: 'These Terms of Service govern your use of the Veritas sports prediction market platform. By accessing or using this platform you agree to be bound by these terms. If you do not agree you must immediately stop using the platform. Veritas is operated as a decentralised prediction market interface. The platform frontend is operated in a centralised manner for compliance purposes including user eligibility checks. The backend settlement, liquidity, and market resolution are handled by the Azuro Protocol, a decentralised smart contract system on the Polygon blockchain. Veritas does not hold, custody, or control user funds at any time.',
    },
    {
      title: 'Platform Architecture',
      body: 'Veritas operates a hybrid model. The frontend of the platform is centralised and managed by the platform operator. This includes user onboarding, identity verification, geoblocking, and compliance controls. The backend of the platform is decentralised and operates through the Azuro Protocol smart contracts on the Polygon blockchain. All bets, trades, and settlements are executed on-chain through non-custodial smart contracts. The platform operator cannot intercept, reverse, or modify any transaction once it has been submitted to the blockchain. Market resolution is handled exclusively by the Azuro oracle system and the platform operator has no ability to influence or override oracle decisions.',
    },
    {
      title: 'User Eligibility',
      body: 'You must be at least 18 years of age to use this platform. By using the platform you confirm that you are 18 years of age or older. You are solely responsible for ensuring your use of the platform complies with all laws and regulations applicable to you in your country, state, or region. Veritas reserves the right to restrict access from additional jurisdictions at any time.',
    },
    {
      title: 'Identity Verification and KYC',
      body: 'The platform operates a tiered identity verification system. Tier 1 applies to users with a cumulative trading volume of up to one thousand United States Dollars. At this tier only a wallet address is required and no withdrawals are available. Tier 2 applies when a user exceeds one thousand United States Dollars in cumulative trading volume. At this tier users must provide their full legal name, date of birth, residential address, email address, and nationality. Tier 3 applies when a user exceeds ten thousand United States Dollars in cumulative volume or engages in activity flagged as suspicious. At this tier users must provide a government-issued photo identification document and proof of residential address. Identity verification is processed by a third-party KYC provider called Didit. All verification data is stored off-chain in an encrypted database and is never recorded on the blockchain.',
    },
    {
      title: 'Wallet Connection and Self-Custody',
      body: 'To use the platform you must connect a compatible cryptocurrency wallet such as MetaMask. The platform does not create, manage, or hold custody of user wallets. You are solely responsible for the security of your wallet, private keys, and seed phrase. The platform operator cannot recover lost wallets, reverse transactions, or access your funds. All funds used for trading remain in your wallet or in non-custodial smart contracts at all times. The platform accepts no liability for the loss of funds resulting from wallet compromise, user error, or any other cause related to wallet security.',
    },
    {
      title: 'Prohibited Conduct',
      body: 'You must not use the platform for any illegal purpose including but not limited to money laundering, terrorist financing, fraud, or market manipulation. You must not attempt to circumvent geoblocking measures using VPN services, proxy servers, or any other technical means. You must not create multiple accounts to circumvent identity verification requirements. You must not engage in wash trading, coordinated manipulation, or any activity designed to distort market prices. You must not attempt to hack, reverse-engineer, or otherwise compromise the security of the platform or its connected smart contracts. You must not use the platform if you are under 18 years of age.',
    },
    {
      title: 'Market Resolution',
      body: 'All prediction markets on the platform are resolved by the Azuro Protocol oracle system. The platform operator has no ability to influence, delay, or override the resolution of any market. In the event of a disputed result the resolution will follow the Azuro Protocol dispute resolution process. If a real-world event is cancelled, postponed, or otherwise rendered undeterminable, the Azuro oracle may void the market and refund all participants. The platform operator accepts no liability for market resolution outcomes.',
    },
    {
      title: 'Limitation of Liability',
      body: 'To the maximum extent permitted by applicable law the platform operator shall not be liable for any direct, indirect, incidental, consequential, or special damages arising from your use of the platform. This includes but is not limited to financial losses from trading, losses resulting from smart contract bugs or exploits, losses resulting from blockchain network failures, losses resulting from wallet compromise, and losses resulting from oracle resolution decisions.',
    },
    {
      title: 'Modifications to Terms',
      body: 'The platform operator reserves the right to modify these terms of service at any time. Changes will be communicated to users through the platform interface. Continued use of the platform after changes are posted constitutes acceptance of the modified terms. It is your responsibility to review these terms periodically.',
    },
    {
      title: 'Contact Information',
      body: 'For all legal enquiries, compliance matters, and regulatory communications please use the contact information provided on the Legal Contact page of this platform.',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400">Last updated: January 2025</p>
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400 font-semibold">Risk Warning: Trading on prediction markets involves significant financial risk. Only trade with money you can afford to lose.</p>
        </div>
      </div>
      {sections.map((s) => (
        <div key={s.title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">{s.title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.body}</p>
        </div>
      ))}
    </div>
  );
}