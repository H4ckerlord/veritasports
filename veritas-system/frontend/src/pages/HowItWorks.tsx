import { useI18n } from '../App';

const steps = [
  { emoji: '🔑', titleKey: 'howItWorks.step1Title', descKey: 'howItWorks.step1Desc' },
  { emoji: '🔍', titleKey: 'howItWorks.step2Title', descKey: 'howItWorks.step2Desc' },
  { emoji: '💸', titleKey: 'howItWorks.step3Title', descKey: 'howItWorks.step3Desc' },
  { emoji: '🏆', titleKey: 'howItWorks.step4Title', descKey: 'howItWorks.step4Desc' },
];

export default function HowItWorks() {
  const { t } = useI18n();

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t('howItWorks.title')}
        </h1>
        <p className="text-gray-400">Simple, transparent, decentralised.</p>
      </div>

      <div className="space-y-6">
        {steps.map((step, i) => (
          <div
            key={step.titleKey}
            className="flex gap-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6"
          >
            <div className="shrink-0 w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-2xl">
              {step.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-brand-500">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {t(step.titleKey)}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t(step.descKey)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">FAQ</h2>

        {[
          {
            q: 'Do I need KYC?',
            a: 'No. Veritas is fully non-custodial. Connect your wallet and start trading.',
          },
          {
            q: 'What token do I use to bet?',
            a: 'All markets use USDC on Polygon. Make sure you have USDC and MATIC for gas.',
          },
          {
            q: 'Who resolves markets?',
            a: "Azuro Protocol's oracle resolves all markets automatically based on real-world data.",
          },
          {
            q: 'Are there fees?',
            a: 'Azuro charges a small protocol margin embedded in the odds. There are no additional Veritas fees.',
          },
        ].map((faq) => (
          <div
            key={faq.q}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5"
          >
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              {faq.q}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
