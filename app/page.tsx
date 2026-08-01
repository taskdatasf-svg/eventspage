import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import EventsList from "@/components/EventsList";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#161618] text-white">
      {/* Sleek Top Navbar */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Separator Line */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-16">
        <div className="border-b border-[#2e2e34]" />
      </div>

      {/* List of Events Section */}
      <EventsList />

      {/* Footer Section */}
      <Footer />
    </main>
  );
}
