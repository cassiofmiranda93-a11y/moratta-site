import Navbar from "@/components/layout/Navbar";
import WhatsAppFloat from "@/components/layout/WhatsAppFloat";
import Footer from "@/components/layout/Footer";

import {
  Hero,
  Benefits,
  Projects,
  About,
  CTA,
} from "@/components/home";

export default function Home() {
  return (
    <>
      <Navbar />

      <Hero />

      <Projects />

      <Benefits />

      <About />

      <CTA />

      <WhatsAppFloat />

      <Footer />
    </>
  );
}
