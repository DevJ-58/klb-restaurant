import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { site } from '../../config/site';
import {
  dayLabelFr,
  formatHours,
  getOpenStatus,
  hoursAreUniform,
  todayInAbidjan,
} from '../../lib/hours';

const dayKeys = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export function HoursCard() {
  const [now, setNow] = useState(() => new Date());
  const currentDay = todayInAbidjan(now);
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const status = getOpenStatus(now);
  const uniform = hoursAreUniform();
  const hours = site.openingHours[dayKeys[selectedDay]];

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const changeDay = (direction: -1 | 1): void => {
    setSelectedDay((day) => (day + direction + dayKeys.length) % dayKeys.length);
  };

  return (
    <div className="find-us-block find-us-hours reveal" data-content>
      <h3 className="find-us-block-title" data-content>Horaires</h3>
      {uniform ? (
        <p className="find-us-hours-line" data-content>
          Tous les jours : {formatHours(site.openingHours.monday.opens)} –{' '}
          {formatHours(site.openingHours.monday.closes)}
        </p>
      ) : (
        <div className="find-us-hours-pager" aria-live="polite">
          <button
            type="button"
            className="find-us-day-button"
            aria-label="Jour précédent"
            onClick={() => changeDay(-1)}
          >
            <ChevronLeft aria-hidden="true" size={20} />
          </button>
          <p className="find-us-hours-line">
            <span className="find-us-day-name">{dayLabelFr(selectedDay)}</span>
            <span>{formatHours(hours.opens)} – {formatHours(hours.closes)}</span>
          </p>
          <button
            type="button"
            className="find-us-day-button"
            aria-label="Jour suivant"
            onClick={() => changeDay(1)}
          >
            <ChevronRight aria-hidden="true" size={20} />
          </button>
        </div>
      )}
      {selectedDay === currentDay && (
        <p className="find-us-open-status" aria-live="polite" data-content>
          <span
            className={`find-us-status-dot${status.isOpen ? ' is-open' : ''}`}
            aria-hidden="true"
          />
          <span>
            {status.isOpen ? 'Ouvert maintenant, ' : 'Fermé, '}
            {status.message.toLocaleLowerCase('fr-FR')}
          </span>
        </p>
      )}
    </div>
  );
}
