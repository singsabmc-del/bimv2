// Staff work shifts: shift definitions + who works which shift on which weekday
import type { TeacherCheckInData, ShiftDef } from '../types';

export const WEEKDAYS = [
  { d: 1, kh: 'ចន្ទ', en: 'Mon' },
  { d: 2, kh: 'អង្គារ', en: 'Tue' },
  { d: 3, kh: 'ពុធ', en: 'Wed' },
  { d: 4, kh: 'ព្រហ', en: 'Thu' },
  { d: 5, kh: 'សុក្រ', en: 'Fri' },
  { d: 6, kh: 'សៅរ៍', en: 'Sat' },
  { d: 0, kh: 'អាទិត្យ', en: 'Sun' },
];

/** Shifts used when none are saved yet */
export const defaultShifts = (data: Pick<TeacherCheckInData, 'startTime' | 'endTime'>): ShiftDef[] => [
  { id: 'full', name: 'ពេញថ្ងៃ (Full day)', start: data.startTime || '07:00', end: data.endTime || '16:00', color: 'teal' },
  { id: 'morning', name: 'វេនព្រឹក (Morning)', start: '07:00', end: '11:00', color: 'amber' },
  { id: 'afternoon', name: 'វេនរសៀល (Afternoon)', start: '13:00', end: '17:00', color: 'sky' },
];

export const shiftsOf = (data: TeacherCheckInData): ShiftDef[] =>
  data.shifts && data.shifts.length ? data.shifts : defaultShifts(data);

/** Default rule: full-day shift Monday–Friday, weekends off */
const DEFAULT_DAY = (weekday: number) => (weekday === 0 || weekday === 6 ? 'off' : 'full');

/** Shift id for one staff member on one weekday ('off' = day off) */
export const assignedShiftId = (data: TeacherCheckInData, staffId: string, weekday: number): string =>
  data.shiftAssignments?.[staffId]?.[weekday] ?? DEFAULT_DAY(weekday);

/** The shift a staff member works on a date, or null on a day off */
export const shiftFor = (data: TeacherCheckInData, staffId: string, dateISO: string): ShiftDef | null => {
  const wd = new Date(dateISO + 'T00:00:00').getDay();
  const id = assignedShiftId(data, staffId, wd);
  if (id === 'off') return null;
  const all = shiftsOf(data);
  return all.find((s) => s.id === id) || all[0] || null;
};

export const SHIFT_COLORS: Record<string, string> = {
  teal: 'bg-teal-100 text-teal-800 border-teal-200',
  amber: 'bg-amber-100 text-amber-900 border-amber-200',
  sky: 'bg-sky-100 text-sky-800 border-sky-200',
  violet: 'bg-violet-100 text-violet-800 border-violet-200',
  rose: 'bg-rose-100 text-rose-800 border-rose-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
};


/** The holiday that covers this date, if any */
export const holidayOn = (data: { holidays?: { from: string; to: string; name: string }[] } | undefined, iso: string) =>
  (data?.holidays || []).find((h) => h.from <= iso && iso <= (h.to || h.from));

/** Distance in metres between two GPS points (haversine) */
export const distanceMeters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
};

/** Current phone position (high accuracy, 15 s timeout) */
export const getCurrentPosition = () =>
  new Promise<{ lat: number; lng: number; accuracy: number }>((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return reject(new Error('unsupported'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }),
      (e) => reject(new Error(e.code === 1 ? 'denied' : e.code === 3 ? 'timeout' : 'unavailable')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
