export default function ContactLegal() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Contact and Legal Enquiries</h1>
        <p className="text-sm text-gray-400">Last updated: January 2025</p>
      </div>

      {[
        {
          title: 'Legal and Regulatory Contact',
          body: 'For all legal, regulatory, compliance, and law enforcement enquiries please contact the platform using the official email address provided below. All legal correspondence must be submitted in writing to this address. Verbal requests will not be actioned. The platform aims to respond to all legitimate legal enquiries within 5 business days.',
        },
        {
          title: 'Official Contact Email',
          body: 'compliance@veritasports.com',
        },
        {
          title: 'Law Enforcement Guidelines',
          body: 'Veritas will comply with valid court orders, subpoenas, and other lawful legal processes issued by courts or regulatory bodies with jurisdiction over the platform or its users. To submit a law enforcement request please contact the platform using the official legal email address. All requests must be submitted on official letterhead and must clearly identify the requesting agency, the legal authority under which the request is made, and the specific information requested. The platform will review all requests for legal validity before responding.',
        },
        {
          title: 'Data Preservation',
          body: 'Upon receiving a valid legal request the platform may preserve relevant records pending formal legal process. The platform will not delete or alter records that are the subject of a pending or anticipated legal request. Preservation requests should be submitted to the official legal email address.',
        },
        {
          title: 'User Notification',
          body: 'The platform will notify affected users of legal requests for their information wherever permitted by law. The platform may be unable to notify users if a court order or law enforcement request prohibits such notification or if notification would compromise an ongoing investigation.',
        },
        {
          title: 'Regulatory Enquiries',
          body: 'Regulatory agencies and government bodies with oversight authority over prediction market platforms, virtual asset service providers, or related financial services are invited to contact the platform using the official legal email address. The platform is committed to working constructively with regulators and will respond promptly to all regulatory enquiries.',
        },
        {
          title: 'General User Support',
          body: 'For general user support and non-legal matters please use the Feedback button available on all pages of the platform. Legal correspondence should not be submitted through the general feedback channel.',
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