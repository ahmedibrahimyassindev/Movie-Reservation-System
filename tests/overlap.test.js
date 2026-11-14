describe('Showtime Schedule Overlap Detection Logic', () => {
  function checkOverlap(startA, endA, startB, endB) {
    const sA = new Date(startA).getTime();
    const eA = new Date(endA).getTime();
    const sB = new Date(startB).getTime();
    const eB = new Date(endB).getTime();

    return sA < eB && eA > sB;
  }

  function calculateEndsAt(startsAt, durationMinutes, bufferMinutes = 15) {
    const start = new Date(startsAt);
    return new Date(start.getTime() + (durationMinutes + bufferMinutes) * 60000);
  }

  it('should detect when two showtimes overlap completely', () => {
    const showtime1 = { start: '2026-12-01T14:00:00Z', end: '2026-12-01T16:30:00Z' };
    const showtime2 = { start: '2026-12-01T14:30:00Z', end: '2026-12-01T16:00:00Z' };

    expect(checkOverlap(showtime1.start, showtime1.end, showtime2.start, showtime2.end)).toBe(true);
  });

  it('should detect when a new showtime starts before the previous one ends', () => {
    const showtime1 = { start: '2026-12-01T14:00:00Z', end: '2026-12-01T16:30:00Z' };
    const showtime2 = { start: '2026-12-01T16:00:00Z', end: '2026-12-01T18:00:00Z' };

    expect(checkOverlap(showtime1.start, showtime1.end, showtime2.start, showtime2.end)).toBe(true);
  });

  it('should allow consecutive showtimes when one starts exactly when the previous ends', () => {
    const showtime1 = { start: '2026-12-01T14:00:00Z', end: '2026-12-01T16:30:00Z' };
    const showtime2 = { start: '2026-12-01T16:30:00Z', end: '2026-12-01T19:00:00Z' };

    expect(checkOverlap(showtime1.start, showtime1.end, showtime2.start, showtime2.end)).toBe(false);
  });

  it('should correctly calculate endsAt including duration and 15-minute cleaning buffer', () => {
    const start = '2026-12-01T18:00:00.000Z';
    const duration = 120; // 2 hours
    const end = calculateEndsAt(start, duration, 15);

    // 18:00 + 2h15m = 20:15
    expect(end.toISOString()).toBe('2026-12-01T20:15:00.000Z');
  });
});

