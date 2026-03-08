/**
 * Privacy — Privacy Policy page
 */

import Footer from '@/components/Footer';

const LAST_UPDATED = 'March 8, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-[#1D1D1F] mb-3">{title}</h3>
      <div className="text-[#3C3C43] leading-relaxed space-y-3 text-sm">{children}</div>
    </div>
  );
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#F0F0F5] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663298408851/XyFvSN3VK3nvaXR5w2ESua/logo-kb4-192_c35ef4c9.png"
              alt="PromptFit"
              className="w-9 h-9 rounded-xl object-cover"
            />
            <div>
              <h1 className="text-base font-bold text-[#1D1D1F] leading-none">PromptFit</h1>
              <p className="text-[11px] text-[#6E6E73]">AI Workout Compiler</p>
            </div>
          </a>
          <a href="/" className="text-sm text-[#007AFF] font-medium hover:opacity-70 transition-opacity">
            ← Back
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-12">
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-[#1D1D1F] tracking-tight mb-3">Privacy Policy</h2>
          <p className="text-sm text-[#8E8E93]">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <Section title="Overview">
            <p>
              PromptFit ("we", "our", or "us") is committed to protecting your privacy. This policy explains what information we collect when you use PromptFit, how we use it, and your rights regarding that information.
            </p>
            <p>
              PromptFit does not require account registration. You can use the workout renderer and exercise library without providing any personal information.
            </p>
          </Section>

          <Section title="Information We Collect">
            <p>
              <strong className="text-[#1D1D1F]">Workout plan data.</strong> When you or a GPT Action submits a workout plan via the API (<code className="bg-[#F5F5F7] px-1 rounded font-mono text-xs">POST /api/get-plan-id</code>), we store the plan JSON in a Redis cache. Plans are identified by a content-addressed hash (SHA-256 Base62) and are retained for up to 30 days with sliding expiration. We do not associate plans with individual users.
            </p>
            <p>
              <strong className="text-[#1D1D1F]">Server logs.</strong> Our servers automatically record standard HTTP request metadata including IP address, user agent, request path, and timestamp. These logs are used for debugging and security purposes and are retained for a limited period.
            </p>
            <p>
              <strong className="text-[#1D1D1F]">Analytics.</strong> We may collect anonymised usage analytics (page views, session counts) to understand how PromptFit is used. No personally identifiable information is included in these analytics.
            </p>
          </Section>

          <Section title="Information We Do Not Collect">
            <p>We do not collect, store, or process:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Names, email addresses, or contact information</li>
              <li>Payment information</li>
              <li>Health or biometric data</li>
              <li>Location data</li>
              <li>Cookies for tracking or advertising purposes</li>
            </ul>
          </Section>

          <Section title="How We Use Your Information">
            <p>The information we collect is used solely to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Serve workout plans when you visit a play URL</li>
              <li>Maintain system reliability and diagnose errors</li>
              <li>Understand aggregate usage patterns to improve the service</li>
            </ul>
            <p>We do not sell, rent, or share your information with third parties for marketing purposes.</p>
          </Section>

          <Section title="Third-Party Services">
            <p>
              PromptFit is integrated with <strong className="text-[#1D1D1F]">OpenAI's ChatGPT</strong> via a GPT Action. When you use the PromptFit GPT, your conversation is subject to OpenAI's Privacy Policy. PromptFit only receives the structured workout plan data that GPT sends to our API — we do not receive your conversation history.
            </p>
          </Section>

          <Section title="Data Retention">
            <p>
              Workout plans submitted via the API are cached for 30 days with sliding expiration. After this period, plans are automatically deleted. Server logs are retained for a limited operational period and then purged.
            </p>
          </Section>

          <Section title="Your Rights">
            <p>
              Since PromptFit does not collect personally identifiable information and does not require account registration, there is no personal data to access, correct, or delete. If you have concerns about data submitted via the API, you may contact us using the information below.
            </p>
          </Section>

          <Section title="Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. The "Last updated" date at the top of this page reflects the most recent revision. Continued use of PromptFit after changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              If you have questions about this Privacy Policy, please reach out via the PromptFit GitHub repository or the contact information provided in the app.
            </p>
          </Section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
