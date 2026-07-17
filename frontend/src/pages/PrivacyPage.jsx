export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-gray-700 dark:text-gray-300">
      <h1 className="text-3xl font-bold text-orange-500 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: June 2025</p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">1. Information We Collect</h2>
        <p>We collect information you provide (name, email, phone, address), order history, location data (when you share it for delivery), and device/usage data.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">2. How We Use Your Information</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To process and deliver your orders</li>
          <li>To send order status notifications (SMS/push)</li>
          <li>To improve our platform and personalize recommendations</li>
          <li>To prevent fraud and ensure platform security</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">3. Location Data</h2>
        <p>Location is only collected when you explicitly share it for delivery tracking. We do not track your location in the background.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">4. Data Sharing</h2>
        <p>We share your data with restaurants (for order fulfillment) and delivery partners (for delivery). We do not sell your personal data to third parties.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">5. Data Security</h2>
        <p>We use industry-standard encryption (HTTPS, JWT) to protect your data. Passwords are hashed and never stored in plain text.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">6. Your Rights</h2>
        <p>You can request deletion of your account and data by contacting us. You can opt out of marketing communications at any time.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">7. Contact</h2>
        <p>Privacy concerns: <a href="mailto:privacy@foodhubpro.in" className="text-orange-500 underline">privacy@foodhubpro.in</a></p>
      </section>
    </div>
  )
}
