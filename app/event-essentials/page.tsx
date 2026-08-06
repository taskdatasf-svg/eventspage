import type { Metadata } from 'next';
import EventEssentials from '@/components/EventEssentials';

export const metadata: Metadata = {
  title: 'Event Essentials | StudentForge Partner & Link Portal',
  description:
    'Access essential links, partner platforms, networking app, and vendor services for StudentForge events. Featuring StudentForge, Forge Digital Technologies, Peopld, Yemnest, and Studio Redlix.',
  openGraph: {
    title: 'Event Essentials | StudentForge Partner & Link Portal',
    description:
      'Official links and verified partner ecosystem for StudentForge events: Networking App, Tech Partners, Vendor Partners & Creative Powerhouse.',
    url: 'https://events.studentforge.in/event-essentials',
    siteName: 'StudentForge',
    images: [
      {
        url: 'https://ik.imagekit.io/dypkhqxip/events%20by%20main.png',
        width: 1200,
        height: 630,
        alt: 'StudentForge Event Essentials Link Portal',
      },
    ],
    type: 'website',
  },
};

export default function EventEssentialsPage() {
  return <EventEssentials />;
}
