export default function TermsOfUse() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Terms of Use</h1>
        <p className="text-sm text-gray-400">Last updated: January 2025</p>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
        <h2 className="font-bold text-red-700 dark:text-red-400 mb-2">Risk Warning</h2>
        <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">
          Trading on prediction markets involves significant financial risk. You may lose some or all of the money you trade with. Only trade with money you can afford to lose. Past performance of any prediction does not guarantee future results. This platform is not suitable for people who cannot afford to lose their investment.
        </p>
      </div>

      {[
        {
          title: '1. Acceptance of Terms',
          body: 'By using the Veritas platform you agree to these terms. If you do not agree you must stop using the platform immediately. These terms may be updated at any time and continued use means you accept the updated terms.',
        },
        {
          title: '2. Eligibility',
          body: 'You must be at least 18 years old to use this platform. You must not be located in a jurisdiction where prediction market trading is prohibited by law. It is your responsibility to ensure your use of this platform complies with all laws applicable to you in your country or region.',
        },
        {
          title: '3. Decentralised Nature',
          body: 'Veritas is a decentralised frontend that connects to the Azuro Protocol on the Polygon blockchain. We do not hold your funds at any time. All funds are held in smart contracts on the blockchain. Market resolution is handled automatically by Azuro\'s oracle system. We have no ability to reverse transactions once confirmed on the blockchain.',
        },
        {
          title: '4. Trading Risks',
          body: 'You acknowledge that prediction market trading carries financial risk. Markets may be voided if events are cancelled or postponed. Smart contracts may contain bugs despite thorough auditing. Blockchain network congestion may affect transaction speed. Cryptocurrency prices and gas fees may fluctuate. You accept all these risks by using the platform.',
        },
        {
          title: '5. No Financial Advice',
          body: 'Nothing on this platform constitutes financial advice, investment advice, or any other type of professional advice. All trading decisions are made solely by you. We are not responsible for any financial losses you incur from trading on this platform.',
        },
        {
          title: '6. Prohibited Activities',
          body: 'You must not use this platform to launder money, finance illegal activities, manipulate markets, or engage in any form of fraud. You must not attempt to hack or exploit the platform or its connected smart contracts. Violation of these prohibitions may result in reporting to relevant authorities.',
        },
        {
          title: '7. Referral Program',
          body: 'The referral program rewards users for bringing new traders to the platform. Rewards are paid from platform fees at our discretion. We reserve the right to modify or terminate the referral program at any time. Abuse of the referral system such as self-referral or creating fake accounts will result in disqualification.',
        },
        {
          title: '8. Intellectual Property',
          body: 'The Veritas name, logo, and website design are the property of the platform owner. You may not copy, reproduce, or use our branding without written permission.',
        },
        {
          title: '9. Limitation of Liability',
          body: 'To the maximum extent permitted by law we are not liable for any direct, indirect, or consequential losses arising from your use of this platform. Our maximum liability to you for any claim is the amount of platform fees you have paid in the 30 days before the claim.',
        },
        {
          title: '10. Governing Law',
          body: 'These terms are governed by the laws of the jurisdiction in which the platform operator is located. Any disputes shall be resolved through binding arbitration.',
        },
        {
          title: '11. Contact',
          body: 'For any questions about these terms please use the Feedback button on our website.',
        },
      ].map((section) => (
        <div key={section.title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">{section.title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{section.body}</p>
        </div>
      ))}
    </div>
  );
}