import { StarField } from "@/components/StarField/StarField";
import { Navbar } from "@/components/Navbar/Navbar";
import { Hero } from "@/components/Hero/Hero";
import { EventFacts } from "@/components/EventFacts/EventFacts";
import { About } from "@/components/About/About";
import { Schedule } from "@/components/Schedule/Schedule";
import { Partners } from "@/components/Partners/Partners";
import { Faq } from "@/components/Faq/Faq";
import { Footer } from "@/components/Footer/Footer";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <>
      <StarField />
      <div className={styles.page}>
        <Navbar />
        <main id="main">
          <Hero />
          <EventFacts />
          <About />
          <Schedule />
          <Partners />
          <Faq />
        </main>
        <Footer />
      </div>
    </>
  );
}
