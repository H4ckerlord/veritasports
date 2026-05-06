export default function ResponsibleTrading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Responsible Trading Policy</h1>
        <p className="text-sm text-gray-400">Last updated: January 2025</p>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
        <h2 className="font-bold text-red-700 dark:text-red-400 mb-2">Important Risk Warning</h2>
        <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">
          Prediction market trading involves significant financial risk. You may lose some or all of the money you commit to trades. Do not trade with money you cannot afford to lose. Do not borrow money to fund your trades. Trading should be approached as a form of informed speculation not as a guaranteed income source. Past accuracy in predictions does not guarantee future results.
        </p>
      </div>

      {[
        {
          title: 'Our Commitment to Responsible Trading',
          body: 'Veritas is committed to promoting responsible participation in prediction markets. We do not encourage excessive trading, gambling-like behaviour, or the use of funds that could harm your financial wellbeing. We provide this platform as a tool for informed market participants who understand the risks involved.',
        },
        {
          title: 'Know Your Limits',
          body: 'Before trading set a clear budget for how much you are willing to commit to prediction markets. Never exceed this budget. Never chase losses by placing larger trades to try to recover money you have lost. Take regular breaks from trading. If you find yourself trading compulsively or in a way that causes you stress or financial hardship please seek help immediately.',
        },
        {
          title: 'Warning Signs of Problem Trading',
          body: 'You may have a problem with excessive trading if you spend more time and money on trading than you intend, if you trade to escape problems or feelings of anxiety or depression, if you borrow money to fund trades, if you lie to family or friends about your trading activity, if you feel restless or irritable when you cannot trade, or if trading is negatively affecting your work, relationships, or finances.',
        },
        {
          title: 'Self-Exclusion',
          body: 'If you believe your trading activity is becoming harmful you can request permanent self-exclusion from the platform. To request self-exclusion contact us using the legal contact information provided on this platform. Upon receiving a valid self-exclusion request the platform will permanently ban your wallet address from placing any trades. Self-exclusion is a serious and permanent measure. Once a wallet address is self-excluded it cannot be reinstated. If you use multiple wallets you must request exclusion for each one separately.',
        },
        {
          title: 'Help and Support Resources',
          body: 'If you or someone you know is struggling with problem gambling or compulsive trading behaviour please seek help from a qualified professional. Many countries offer free helplines and support services for problem gamblers. In Nigeria contact the National Council on Problem Gambling. In the United Kingdom contact GamCare at gamcare.org.uk or the National Gambling Helpline on 0808 8020 133. Internationally the International Problem Gambling Helpline directory at gamblinghelp.org can help you find local support.',
        },
        {
          title: 'Platform Safeguards',
          body: 'Veritas applies geoblocking to prevent users from jurisdictions with strict gambling regulations from accessing the platform. The platform applies a tiered identity verification system that helps monitor trading volumes. The platform reserves the right to contact users whose trading patterns suggest potential problem behaviour and to apply restrictions where necessary for user protection.',
        },
      ].map((s) => (
        <div key={s.title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">{s.title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.body}</p>
        </div>
      ))}
    </div>
  );
}