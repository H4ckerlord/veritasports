export default function AuditTrail() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Audit Trail and Transparency</h1>
        <p className="text-sm text-gray-400">Last updated: January 2025</p>
      </div>
      {[
        {
          title: 'On-Chain Transparency',
          body: 'Every trade, bet placement, and market resolution on the Veritas platform is executed through the Azuro Protocol smart contracts on the Polygon blockchain. This means every transaction creates a permanent, immutable, and publicly verifiable record on the blockchain. Anyone can independently audit the complete history of all platform activity using public blockchain explorers such as Polygonscan at polygonscan.com. No transaction can be altered, deleted, or hidden once it has been confirmed on the blockchain. This provides a level of transparency that is not achievable with traditional centralised platforms.',
        },
        {
          title: 'Smart Contract Verification',
          body: 'The Azuro Protocol smart contracts used for market creation, bet settlement, and fund custody are publicly available and have been audited by independent security firms. The contract addresses and audit reports are published by Azuro Protocol on their official documentation at gem.azuro.org. Users are encouraged to review these contracts and audits before using the platform.',
        },
        {
          title: 'Oracle and Market Resolution Transparency',
          body: 'Market resolution is handled by the Azuro oracle system. Oracle decisions and the data sources used to resolve markets are recorded on-chain and can be independently verified. The platform operator has no ability to influence oracle decisions. In the event of a disputed resolution the Azuro dispute resolution process is fully on-chain and auditable.',
        },
        {
          title: 'Off-Chain Compliance Records',
          body: 'In addition to on-chain transaction records the platform maintains off-chain records for compliance purposes. These include logs of identity verification attempts processed through the Didit KYC provider, records of geoblocking enforcement, and records of suspicious activity reports. These off-chain records are stored in an encrypted database and are not publicly accessible. They may be disclosed to law enforcement or regulatory agencies in response to valid legal requests.',
        },
        {
          title: 'Hybrid Transparency Model',
          body: 'The combination of on-chain transaction transparency and off-chain compliance records creates a hybrid accountability system. Financial transactions are fully public and verifiable by anyone. Personal identity information is private and protected but available to authorised legal and regulatory authorities when required by law. This model is designed to balance user privacy with legal accountability.',
        },
        {
          title: 'How to Audit Platform Activity',
          body: 'To audit any transaction on the platform visit polygonscan.com and search for the transaction hash or wallet address associated with the trade. All bet placements, market creations, and settlements will appear as smart contract interactions with the Azuro Protocol contracts. The complete transaction history for any wallet address is permanently available and cannot be altered.',
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