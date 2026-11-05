import { Faq, type FaqItem } from '../components/faq/Faq';
import { FindUs } from '../components/find-us/FindUs';
import { TransitionLink } from '../components/transition/TransitionLink';
import { site } from '../config/site';
import { restaurantStructuredData } from '../lib/structuredData';
import { usePageMeta } from '../lib/usePageMeta';
import {
  dayLabelFr,
  formatBusinessHours,
  formatHours,
  formatPhone,
  hoursAreUniform,
} from '../lib/hours';

function getHoursAnswer(): string {
  if (hoursAreUniform()) {
    return formatBusinessHours();
  }
  const dayKeys = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ] as const;
  return dayKeys
    .map((day, index) => {
      const hours = site.openingHours[day];
      return `${dayLabelFr(index)} : ${formatHours(hours.opens)} – ${formatHours(hours.closes)}`;
    })
    .join(' ; ');
}

const phone = formatPhone(site.phone);
const hoursAnswer = getHoursAnswer();
const faqItems: readonly FaqItem[] = [
  {
    question: 'Comment commander ?',
    answer: (
      <>
        Deux possibilités. Au restaurant, ouvrez le menu de votre table avec le QR code posé
        dessus. À distance, appelez-nous ou écrivez-nous sur WhatsApp au {phone}.
      </>
    ),
    answerText: `Deux possibilités. Au restaurant, ouvrez le menu de votre table avec le QR code posé dessus. À distance, appelez-nous ou écrivez-nous sur WhatsApp au ${phone}.`,
  },
  {
    question: 'Quels sont vos horaires ?',
    answer: hoursAnswer,
    answerText: hoursAnswer,
  },
  {
    question: 'Où se trouve KLB ?',
    answer: (
      <>
        Dans le quartier {site.neighborhood}, à {site.city}. L’itinéraire est disponible sur{' '}
        <a href={site.googleMapsUrl} target="_blank" rel="noopener noreferrer">
          Google Maps
        </a>
        .
      </>
    ),
    answerText: `Dans le quartier ${site.neighborhood}, à ${site.city}. L’itinéraire est disponible sur Google Maps.`,
  },
  {
    question: 'Faut-il réserver ?',
    answer: (
      <>
        Il n’y a pas de réservation en ligne sur ce site. Pour une commande à distance,
        appelez-nous ou écrivez-nous sur WhatsApp ; sur place, le menu de votre table s’ouvre
        avec son QR code.
      </>
    ),
    answerText:
      'Il n’y a pas de réservation en ligne sur ce site. Pour une commande à distance, appelez-nous ou écrivez-nous sur WhatsApp ; sur place, le menu de votre table s’ouvre avec son QR code.',
  },
  {
    question: 'Que propose la carte ?',
    answer: (
      <>
        Des plats sur commande, des formules et des garnitures au choix. Le détail est sur la{' '}
        <TransitionLink to="/carte">page Carte</TransitionLink>.
      </>
    ),
    answerText:
      'Des plats sur commande, des formules et des garnitures au choix. Le détail est sur la page Carte.',
  },
];

function JsonLd({ id, data }: { id: string; data: object }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function FindUsPage() {
  usePageMeta({
    title: 'Nous trouver — KLB Restaurant',
    description:
      'Adresse, horaires et contact de KLB Restaurant, quartier Morofé à Yamoussoukro.',
    path: '/nous-trouver',
  });
  const restaurantJsonLd = restaurantStructuredData();
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ question, answerText }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answerText,
      },
    })),
  };

  return (
    <>
      <JsonLd id="nous-trouver-restaurant-jsonld" data={restaurantJsonLd} />
      <JsonLd id="nous-trouver-faq-jsonld" data={faqJsonLd} />
      <section className="find-us-page-hero" aria-labelledby="nous-trouver-title" data-theme="dark">
        <div className="find-us-page-hero-inner">
          <h1 id="nous-trouver-title" data-content>
            <span className="find-us-page-title-line">
              <span>Nous</span>
            </span>
            <span className="find-us-page-title-line">
              <span>trouver</span>
            </span>
          </h1>
          <p data-content>
            Au quartier {site.neighborhood}, à {site.city}. Appelez, écrivez-nous ou passez à table.
          </p>
        </div>
      </section>
      <FindUs variant="page" />
      <Faq items={faqItems} />
    </>
  );
}
