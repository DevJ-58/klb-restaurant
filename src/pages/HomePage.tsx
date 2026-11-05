import { useState } from 'react';
import { HeroStage } from '../components/home/HeroStage';
import { Incontournables } from '../components/home/Incontournables';
import { Chiffres } from '../components/home/Chiffres';
import { Ambiance } from '../components/home/Ambiance';
import { Marquee } from '../components/home/Marquee';
import { SectionTransitions } from '../components/home/SectionTransitions';
import { FindUs } from '../components/find-us/FindUs';
import { OrderTiles } from '../components/order-tiles/OrderTiles';
import { restaurantStructuredData } from '../lib/structuredData';
import { usePageMeta } from '../lib/usePageMeta';

const restaurantJsonLd = restaurantStructuredData();

export function HomePage() {
  const [homeElement, setHomeElement] = useState<HTMLDivElement | null>(null);
  usePageMeta({
    title: 'KLB Restaurant — Bonne cuisine, bonne ambiance',
    description:
      'KLB Restaurant et cafétéria à Morofé, Yamoussoukro. Bonne cuisine, bonne ambiance !',
    path: '/',
  });

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(restaurantJsonLd)}</script>
      <div className="home-page" ref={setHomeElement}>
        <SectionTransitions scope={homeElement} />
        <HeroStage />
        <Incontournables />
        <Chiffres />
        <Ambiance />
        <Marquee />
        <OrderTiles />
        <FindUs />
      </div>
    </>
  );
}
