export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400">Last updated: January 2025</p>
      </div>

      {[
        {
          title: '1. Who We Are',
          body: 'Veritas is a decentralised sports prediction market platform. We do not hold your funds, control your trades, or act as a financial intermediary. All trading activity happens on the Polygon blockchain through the Azuro Protocol.',
        },
        {
          title: '2. Information We Collect',
          body: 'We collect the minimum information necessary to operate the platform. This includes your wallet address when you connect to our site, feedback messages you voluntarily submit, and anonymous page visit counts for internal analytics. We do not collect your name, email address, phone number, or any personal identification information.',
        },
        {
          title: '3. How We Use Your Information',
          body: 'Your wallet address is used to track referral rewards and allow you to claim earnings. Feedback messages are sent to our admin team to improve the platform. Anonymous visit counts help us understand how the platform is growing. We do not sell, rent, or share your information with any third parties.',
        },
        {
          title: '4. Cookies and Tracking',
          body: 'We do not use advertising cookies or tracking pixels. We do not use Google Analytics or any external analytics service. Our internal analytics only counts page visits anonymously without identifying individual users.',
        },
        {
          title: '5. Blockchain Transparency',
          body: 'All trades placed on this platform are recorded permanently on the Polygon blockchain. Your wallet address and trade amounts are publicly visible on the blockchain. This is a fundamental property of blockchain technology and not something we control.',
        },
        {
          title: '6. Your Rights',
          body: 'You can disconnect your wallet at any time to stop using the platform. Referral data associated with your wallet address can be removed upon request by contacting us. Since we do not collect personal information, there is no personal data profile to delete.',
        },
        {
          title: '7. Security',
          body: 'We take reasonable measures to protect the platform. However, because this is a decentralised application, we cannot be held responsible for losses resulting from blockchain network issues, smart contract bugs, or user error such as sending funds to the wrong address.',
        },
        {
          title: '8. Changes to This Policy',
          body: 'We may update this privacy policy from time to time. Continued use of the platform after changes are posted means you accept the new policy.',
        },
        {
          title: '9. Contact',
          body: 'If you have questions about this privacy policy please use the Feedback button on our website to reach us.',
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