const phoneNumber = '+2250505520139';

export const site = {
  name: 'KLB Restaurant',
  slogan: 'Bonne cuisine, bonne ambiance !',
  promises: ['Cuisine de qualité', 'Service chaleureux', 'Moment inoubliable'],
  neighborhood: 'Morofé',
  city: 'Yamoussoukro',
  country: 'Côte d’Ivoire',
  openingHours: {
    monday: { opens: '08:30', closes: '23:30' },
    tuesday: { opens: '08:30', closes: '23:30' },
    wednesday: { opens: '08:30', closes: '23:30' },
    thursday: { opens: '08:30', closes: '23:30' },
    friday: { opens: '08:30', closes: '23:30' },
    saturday: { opens: '08:30', closes: '23:30' },
    sunday: { opens: '08:30', closes: '23:30' },
  },
  phone: phoneNumber,
  phoneLink: `tel:${phoneNumber}`,
  whatsappLink(dishName?: string): string {
    const message = dishName
      ? `Bonjour KLB, je souhaite commander : ${dishName}`
      : 'Bonjour KLB, je souhaite commander :';
    return `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
  },
  googleMapsUrl: 'https://maps.app.goo.gl/5AnSXfayGygUcb557',
  tableMenuUrl: import.meta.env.VITE_TABLE_MENU_URL ?? '',
  mapEmbedUrl: import.meta.env.VITE_MAP_EMBED_URL ?? '',
  socials: {
    instagram: '',
    facebook: '',
    tiktok: '',
  },
} as const;
