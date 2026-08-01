export interface EventData {
  id: string;
  ticketCode: string;
  title: string;
  organizer: string;
  createdByEmail?: string;
  location: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  price: string;
  requireApproval: boolean;
  capacity: string;
  calendarType: string;
  visibility: string;
  coverImage?: string | null;
  headerBg: string;
  font: string;
  themeIdx?: number;
  customFields?: string | null;
  speakers?: string | null;
  createdAt: string;
}

const STORAGE_KEY = 'student_forge_user_events';

export function getStoredEvents(): EventData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading events from localStorage:', e);
    return [];
  }
}

export function saveEvent(event: Omit<EventData, 'id' | 'ticketCode' | 'createdAt'>): EventData {
  const existing = getStoredEvents();
  
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  const newEvent: EventData = {
    ...event,
    id: `event-${Date.now()}`,
    ticketCode: `GBD${randomChars}`,
    createdAt: new Date().toISOString()
  };

  const updated = [newEvent, ...existing];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return newEvent;
}
export function deleteEvent(id: string): void {
  const existing = getStoredEvents();
  const updated = existing.filter((e) => e.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}

export function updateEvent(id: string, changes: Partial<EventData>): void {
  const existing = getStoredEvents();
  const updated = existing.map((e) => (e.id === id ? { ...e, ...changes } : e));
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}
