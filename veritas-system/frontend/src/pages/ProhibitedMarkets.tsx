export default function ProhibitedMarkets() {
  const prohibited = [
    { title: 'Assassination and Political Violence', body: 'Any market that speculates on the death, injury, or targeting of a specific named individual whether a public figure or private person is strictly prohibited. This includes markets framed as questions about the death of world leaders, politicians, celebrities, or any other individual.' },
    { title: 'Terrorism and Extremist Activity', body: 'Markets that speculate on terrorist attacks, the actions of designated terrorist organisations, or outcomes related to extremist violence are prohibited. This includes markets about the success or failure of terrorist operations or the actions of extremist groups.' },
    { title: 'War Crimes and Atrocities', body: 'Markets that speculate on war crimes, genocide, mass civilian casualties, or the targeting of civilian infrastructure are prohibited. Markets about the outcome of wars may be permitted if they are framed around official military or political outcomes rather than civilian harm.' },
    { title: 'Hate Speech and Discrimination', body: 'Any market that requires users to take positions based on race, ethnicity, religion, gender, sexual orientation, disability, or national origin in a discriminatory manner is prohibited. This includes markets designed to humiliate or dehumanise any group.' },
    { title: 'Illegal Activities', body: 'Markets that speculate on the outcome of planned or ongoing illegal activities are prohibited. This includes markets about drug trafficking, human trafficking, financial crimes, or any other activity that is illegal under applicable law.' },
    { title: 'Market Manipulation', body: 'Markets that are designed to be manipulated or that involve insider information are prohibited. Users must not propose or participate in markets where they have access to material non-public information that would give them an unfair advantage.' },
    { title: 'Child Safety', body: 'Any market involving or referencing children in a harmful context is absolutely prohibited. This includes markets about child abuse, exploitation, or any other harm to minors.' },
    { title: 'Personal Private Information', body: 'Markets that speculate on private information about individuals that has not been made publicly available are prohibited. This includes markets based on private medical information, private communications, or other non-public personal data.' },
    { title: 'Synthetic or Unverifiable Events', body: 'Markets about events that cannot be objectively verified by a reliable oracle or public data source are prohibited. All markets must have a clear and objective resolution criteria that can be verified without ambiguity.' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Prohibited Market Policy</h1>
        <p className="text-sm text-gray-400">Last updated: January 2025</p>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Veritas is committed to operating a lawful, ethical, and responsible prediction market platform. The following categories of markets are prohibited on the platform. Veritas reserves the right to remove any market that falls within these categories or that otherwise violates applicable law, regardless of whether it is explicitly listed here. Users must not propose, create, or trade on prohibited markets. Violation of this policy may result in permanent suspension of your access to the platform. Veritas considers itself a neutral technology provider but acknowledges its legal and moral obligations to prevent harmful market activity.
        </p>
      </div>
      {prohibited.map((s) => (
        <div key={s.title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">{s.title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.body}</p>
        </div>
      ))}
      <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-2xl p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          If you encounter a market on this platform that you believe violates this policy please use the Feedback button to report it immediately. The platform team reviews all reports and will take appropriate action including market removal and user suspension where warranted.
        </p>
      </div>
    </div>
  );
}