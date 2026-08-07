export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export function isEventCompleted(event: {
  startDate?: string | null;
  startTime?: string | null;
  endDate?: string | null;
  endTime?: string | null;
} | null | undefined): boolean {
  if (!event) return false;

  const dateStr = event.endDate || event.startDate;
  if (!dateStr) return false;

  try {
    // 1. Try direct Date parsing for ISO / standard date strings
    const directDate = new Date(dateStr);
    if (!isNaN(directDate.getTime()) && dateStr.includes('-')) {
      const timeStr = event.endTime || event.startTime;
      if (timeStr) {
        const [h, m] = timeStr.split(':').map((n) => parseInt(n, 10));
        if (!isNaN(h)) directDate.setHours(h, !isNaN(m) ? m : 0, 0, 0);
      } else {
        directDate.setHours(23, 59, 59, 999);
      }
      return directDate.getTime() < Date.now();
    }

    // 2. Parse relative/formatted date strings like "Sat, 1 Aug" or "Sun, 9 Aug"
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };

    const match = dateStr.match(/(\d{1,2})\s+([a-zA-Z]{3})/);
    if (match) {
      const day = parseInt(match[1], 10);
      const monthIdx = months[match[2].toLowerCase()];
      if (monthIdx !== undefined && !isNaN(day)) {
        const year = new Date().getFullYear();
        const eventDate = new Date(year, monthIdx, day);

        const timeStr = event.endTime || event.startTime;
        if (timeStr) {
          const [h, m] = timeStr.split(':').map((n) => parseInt(n, 10));
          if (!isNaN(h)) eventDate.setHours(h, !isNaN(m) ? m : 0, 0, 0);
          else eventDate.setHours(23, 59, 59, 999);
        } else {
          eventDate.setHours(23, 59, 59, 999);
        }

        return eventDate.getTime() < Date.now();
      }
    }
  } catch (err) {
    console.error('isEventCompleted parse error:', err);
  }

  return false;
}

