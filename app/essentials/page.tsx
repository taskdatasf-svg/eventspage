import type { Metadata } from 'next';
import EventEssentials from '@/components/EventEssentials';

export const metadata: Metadata = {
  title: 'Event Essentials | StudentForge Partner & Link Portal',
  description:
    'Access essential links, partner platforms, networking app, and vendor services for StudentForge events.',
};

export default function EssentialsPage() {
  return <EventEssentials />;
}
