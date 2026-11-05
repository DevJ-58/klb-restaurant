import { site } from '../config/site';

const schemaDayNames = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
} as const;

export function restaurantStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: site.name,
    telephone: site.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `Quartier ${site.neighborhood}`,
      addressLocality: site.city,
      addressCountry: 'CI',
    },
    openingHoursSpecification: Object.entries(schemaDayNames).map(([key, day]) => {
      const hours = site.openingHours[key as keyof typeof site.openingHours];
      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${day}`,
        opens: hours.opens,
        closes: hours.closes,
      };
    }),
    hasMap: site.googleMapsUrl,
  };
}
