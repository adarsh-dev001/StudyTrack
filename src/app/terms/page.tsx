
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16 lg:py-20">
        <div className="px-4 md:px-6"> {/* Removed 'container' class */}
          <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">
            Terms of Service
          </h1>
          <div className="prose prose-lg max-w-none text-foreground">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p>Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the StudyTrack website (the "Service") operated by StudyTrack ("us", "we", or "our").</p>
            <p>Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users and others who access or use the Service.</p>
            <p>By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.</p>
            
            <h2 className="font-headline">Accounts</h2>
            <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
            <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.</p>
            <p>You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>

            <h2 className="font-headline">Intellectual Property</h2>
            <p>The Service and its original content, features and functionality are and will remain the exclusive property of StudyTrack and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of StudyTrack.</p>
            
            <h2 className="font-headline">Links To Other Web Sites</h2>
            <p>Our Service may contain links to third-party web sites or services that are not owned or controlled by StudyTrack.</p>
            <p>StudyTrack has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services. You further acknowledge and agree that StudyTrack shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such web sites or services.</p>
            
            <h2 className="font-headline">Termination</h2>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
            <p>Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.</p>
            
            <h2 className="font-headline">Governing Law</h2>
            <p>These Terms shall be governed and construed in accordance with the laws of Your Country, without regard to its conflict of law provisions.</p>
            
            <h2 className="font-headline">Changes</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
            
            <h2 className="font-headline">Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at terms@studytrack.example.com.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
