import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import MobileCtaBar from '@/components/layout/MobileCtaBar';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import About from '@/components/sections/About';
import Audience from '@/components/sections/Audience';
import Benefits from '@/components/sections/Benefits';
import Curriculum from '@/components/sections/Curriculum';
import Exams from '@/components/sections/Exams';
import Faq from '@/components/sections/Faq';
import Hero from '@/components/sections/Hero';
import HowItWorks from '@/components/sections/HowItWorks';
import Pricing from '@/components/sections/Pricing';
import Register from '@/components/sections/Register';
import Stats from '@/components/sections/Stats';
import Testimonials from '@/components/sections/Testimonials';

export default function Home() {
  return (
    <>
      <a
        href="#register"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-navy-900"
      >
        Skip to registration
      </a>
      <AnnouncementBar />
      <Header />
      <main>
        <Hero />
        <Stats />
        <Benefits />
        <Audience />
        <Curriculum />
        <HowItWorks />
        <Pricing />
        <Register />
        <About />
        <Exams />
        <Testimonials />
        <Faq />
      </main>
      <Footer />
      <MobileCtaBar />
      <WhatsAppButton />
    </>
  );
}
