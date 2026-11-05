import { site } from '../config/site';

type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

type OpenStatus = {
  isOpen: boolean;
  message: string;
  dayIndex: number;
};

const weekdays: readonly Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
const weekdayLabels = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

function minutesFromTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatHours(time: string): string {
  const [hours = '0', minutes = '00'] = time.split(':');
  return `${Number(hours)}\u00a0h\u00a0${minutes}`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('225') && digits.length === 13) {
    const nationalNumber = digits.slice(3);
    return `+225 ${nationalNumber.match(/.{1,2}/g)?.join(' ') ?? nationalNumber}`;
  }
  return phone;
}

export function dayLabelFr(index: number): string {
  const label = weekdayLabels[index];
  if (!label) {
    throw new RangeError(`Index de jour invalide : ${index}.`);
  }
  return label;
}

export function todayInAbidjan(now: Date = new Date()): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Abidjan',
    weekday: 'long',
  }).format(now);
  const index = weekdays.findIndex((day) => day === weekday.toLowerCase());
  if (index < 0) {
    throw new Error('Impossible de déterminer le jour local du restaurant.');
  }
  return index;
}

export function hoursAreUniform(): boolean {
  const first = site.openingHours.monday;
  return weekdays.every((weekday) => {
    const hours = site.openingHours[weekday];
    return hours.opens === first.opens && hours.closes === first.closes;
  });
}

export function formatBusinessHours(): string {
  const first = site.openingHours.monday;
  if (hoursAreUniform()) {
    return `Tous les jours, de ${formatHours(first.opens)} à ${formatHours(first.closes)}`;
  }
  return weekdays
    .map((weekday, index) => {
      const { opens, closes } = site.openingHours[weekday];
      return `${dayLabelFr(index)} : ${formatHours(opens)} – ${formatHours(closes)}`;
    })
    .join(' ; ');
}

export function getOpenStatus(now: Date = new Date()): OpenStatus {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Abidjan',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const dayIndex = todayInAbidjan(now);
  const weekday = weekdays[dayIndex];
  const hour = parts.find((part) => part.type === 'hour')?.value;
  const minute = parts.find((part) => part.type === 'minute')?.value;

  if (!weekday || hour === undefined || minute === undefined) {
    throw new Error('Impossible de déterminer l’heure locale du restaurant.');
  }

  const hours = site.openingHours[weekday];
  const currentMinutes = Number(hour) * 60 + Number(minute);
  const isOpen =
    currentMinutes >= minutesFromTime(hours.opens) &&
    currentMinutes < minutesFromTime(hours.closes);

  return {
    isOpen,
    dayIndex,
    message: isOpen
      ? `Ferme à ${formatHours(hours.closes)}`
      : `Ouvre à ${formatHours(hours.opens)}`,
  };
}
