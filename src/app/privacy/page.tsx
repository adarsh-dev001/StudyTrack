import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16 lg:py-20">
        <div className="container px-4 md:px-6">
          <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">
            Privacy Policy
          </h1>
          <div className="prose prose-lg max-w-none text-foreground">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p>
              Welcome to StudyTrack! We are committed to protecting your personal information and your right to privacy.
              If you have any questions or concerns about this privacy notice, or our practices with regards to your
              personal information, please contact us.
            </p>
            <h2 className="font-headline">Information We Collect</h2>
            <p>
              We collect personal information that you voluntarily provide to us when you register on the StudyTrack,
              express an interest in obtaining information about us or our products and services, when you participate
              in activities on the StudyTrack or otherwise when you contact us.
            </p>
            <p>
              The personal information that we collect depends on the context of your interactions with us and the
              StudyTrack, the choices you make and the products and features you use. The personal information we collect
              may include the following: names; email addresses; passwords; contact preferences; contact or
              authentication data; and other similar information.
            </p>
            <h2 className="font-headline">How We Use Your Information</h2>
            <p>
              We use personal information collected via our StudyTrack for a variety of business purposes described below.
              We process your personal information for these purposes in reliance on our legitimate business interests,
              in order to enter into or perform a contract with you, with your consent, and/or for compliance with our
              legal obligations.
            </p>
            <ul>
              <li>To facilitate account creation and logon process.</li>
              <li>To post testimonials.</li>
              <li>Request feedback.</li>
              <li>To enable user-to-user communications.</li>
              <li>To manage user accounts.</li>
              <li>To send administrative information to you.</li>
              <li>To protect our Services.</li>
              <li>To enforce our terms, conditions and policies for business purposes, to comply with legal and regulatory requirements or in connection with our contract.</li>
            </ul>
            <h2 className="font-headline">Will Your Information Be Shared With Anyone?</h2>
            <p>
              We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
            </p>
            {/* Add more sections as needed */}
            <h2 className="font-headline">Contact Us</h2>
            <p>
              If you have questions or comments about this notice, you may email us at privacy@studytrack.example.com
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
