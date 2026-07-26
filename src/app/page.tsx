import Navbar from "@/components/layout/Navbar";
import WhatsAppFloat from "@/components/layout/WhatsAppFloat";
import Footer from "@/components/layout/Footer";

import {
  Hero,
  Benefits,
  Stats,
  Projects,
  About,
  CTA,
} from "@/components/home";

export default function Home() {
  return (
    <>
      <Navbar />

      <Hero />

      <Stats />

      <Benefits />

      <Projects />

      <About />

      <CTA />

      <WhatsAppFloat />

      <Footer />
    </>
  );
}