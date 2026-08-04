import Hero from "@/components/Hero";
import EventsList from "@/components/EventsList";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#161618] text-white">
      <Hero />



      <EventsList />

      <Footer />
    </main>
  );
}
