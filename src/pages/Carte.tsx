import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import {
  MessageCircle,
  Phone,
  QrCode,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getItem, formatPrice, menu, type MenuCategory, type MenuItem } from '../data/menu';
import { site } from '../config/site';
import { Plate } from '../components/ui/Plate';
import { SectionShell } from '../components/SectionShell';
import { usePageTransition } from '../components/transition/TransitionProvider';
import { scrollLenisTo } from '../lib/lenis';
import { prefersReducedMotion } from '../lib/motion';
import { useReveal } from '../lib/useReveal';
import { usePageMeta } from '../lib/usePageMeta';

gsap.registerPlugin(ScrollTrigger);

type OrderMode = 'restaurant' | 'distance';

function getCategoryIconImport(name: string) {
  const slug = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  return dynamicIconImports[slug as keyof typeof dynamicIconImports];
}

function MenuCategoryTab({
  category,
  active,
  onSelect,
  registerElement,
}: {
  category: MenuCategory;
  active: boolean;
  onSelect: () => void;
  registerElement: (element: HTMLButtonElement | null) => void;
}) {
  const [Icon, setIcon] = useState<LucideIcon>(() => UtensilsCrossed);

  useEffect(() => {
    let activeRequest = true;
    const iconImport = getCategoryIconImport(category.icon);
    setIcon(() => UtensilsCrossed);
    if (!iconImport) {
      return () => {
        activeRequest = false;
      };
    }

    void iconImport()
      .then(({ default: LoadedIcon }) => {
        if (activeRequest) {
          setIcon(() => LoadedIcon);
        }
      })
      .catch((error: unknown) => {
        console.error(`Impossible de charger l’icône "${category.icon}" du menu.`, error);
      });

    return () => {
      activeRequest = false;
    };
  }, [category.icon]);

  return (
    <button
      className={`menu-tab${active ? ' is-active' : ''}`}
      type="button"
      aria-current={active ? 'location' : undefined}
      onClick={onSelect}
      ref={registerElement}
    >
      <Icon aria-hidden="true" size={18} />
      <span>{category.label}</span>
    </button>
  );
}

const availableCategories = menu.filter((category) => category.items.length > 0);
function getCanardLaque(): MenuItem {
  const item = getItem('canard-laque');
  if (!item) {
    throw new Error('Le plat canard-laque est absent de src/data/menu.ts.');
  }
  return item;
}

function getStoredMode(): OrderMode {
  try {
    return window.sessionStorage.getItem('klb-order-mode') === 'restaurant'
      ? 'restaurant'
      : 'distance';
  } catch (error) {
    console.warn('Le mode de commande ne peut pas être lu depuis sessionStorage.', error);
    return 'distance';
  }
}

function storeMode(mode: OrderMode): void {
  try {
    window.sessionStorage.setItem('klb-order-mode', mode);
  } catch (error) {
    console.warn('Le mode de commande ne peut pas être mémorisé dans sessionStorage.', error);
  }
}

function formatOpeningTime(time: string): string {
  const [hour, minute] = time.split(':');
  return `${Number(hour)} h ${minute}`;
}

function buildMenuSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: `La carte — ${site.name}`,
    hasMenuSection: availableCategories.map((category) => ({
      '@type': 'MenuSection',
      name: category.label,
      description: category.intro,
      hasMenuItem: category.items.map((item) => ({
        '@type': 'MenuItem',
        name: item.name,
        description: item.note,
        ...(item.price?.kind === 'fixed'
          ? {
              offers: {
                '@type': 'Offer',
                price: item.price.amount,
                priceCurrency: 'XOF',
              },
            }
          : {}),
      })),
    })),
  };
}

const menuSchema = buildMenuSchema();
const menuDescription = `${availableCategories.map(({ label }) => label.toLowerCase()).join(', ')} à ${site.city}`;

function MenuRow({
  item,
  categoryPrice,
  mode,
}: {
  item: MenuItem;
  categoryPrice: MenuCategory['price'];
  mode: OrderMode;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(item.image) && !imageFailed;
  const price = item.price ?? categoryPrice;
  const note = item.note ?? 'Sur commande';

  return (
    <li
      className={`menu-row${showImage ? ' menu-row--with-image' : ''}`}
      data-content
      data-reveal="row"
    >
      {showImage && item.image && (
        <span className="menu-row-image">
          <img
            src={item.image}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        </span>
      )}
      <div className="menu-row-copy">
        <h3>{item.name}</h3>
        <p className={item.note === undefined ? 'menu-row-note menu-row-note--order' : 'menu-row-note'}>
          {note}
        </p>
      </div>
      <p className="menu-row-price">{price ? formatPrice(price) : null}</p>
      {mode === 'distance' && (
        <a
          className="menu-row-order"
          href={site.whatsappLink(item.name)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Commander ${item.name} sur WhatsApp`}
        >
          <MessageCircle aria-hidden="true" size={18} />
          <span>Commander</span>
        </a>
      )}
    </li>
  );
}

function MenuCategorySection({
  category,
  mode,
}: {
  category: MenuCategory;
  mode: OrderMode;
}) {
  const [categoryImageFailed, setCategoryImageFailed] = useState(false);
  const usesCommonPrice =
    Boolean(category.price) && category.items.every((item) => item.price === undefined);

  return (
    <section
      className="menu-category"
      id={`menu-${category.id}`}
      data-menu-category={category.id}
      aria-labelledby={`menu-heading-${category.id}`}
    >
      <h2 id={`menu-heading-${category.id}`} data-content data-reveal="item">
        {category.label}
      </h2>
      {usesCommonPrice ? (
        <div className="menu-category-common">
          {category.image && !categoryImageFailed && (
            <div className="menu-category-image">
              <img
                src={category.image}
                alt=""
                className="menu-category-image-photo"
                loading="lazy"
                decoding="async"
                onError={() => setCategoryImageFailed(true)}
              />
            </div>
          )}
          <div className="menu-category-common-copy">
            {category.intro && <p data-content>{category.intro}</p>}
            <ul className="menu-chips" aria-label={category.label}>
              {category.items.map((item) => (
                <li key={item.id} data-content data-reveal="row">
                  {item.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <>
          {category.intro && <p className="menu-category-intro" data-content>{category.intro}</p>}
          <ul className="menu-rows" aria-label={category.label}>
            {category.items.map((item) => (
              <MenuRow
                key={item.id}
                item={item}
                categoryPrice={category.price}
                mode={mode}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function MenuStructuredData() {
  return (
    <script type="application/ld+json">
      {JSON.stringify(menuSchema)}
    </script>
  );
}

export function Carte() {
  usePageMeta({
    title: 'La carte — KLB Restaurant',
    description: menuDescription,
    path: '/carte',
  });
  const canardLaque = getCanardLaque();
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const heroPlateRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const modePanelRef = useRef<HTMLDivElement>(null);
  const categoryElements = useRef(new Map<string, HTMLElement>());
  const tabElements = useRef(new Map<string, HTMLButtonElement>());
  const [mode, setMode] = useState<OrderMode>(getStoredMode);
  const [activeCategory, setActiveCategory] = useState(availableCategories[0]?.id ?? '');
  const [indicatorStyle, setIndicatorStyle] = useState<CSSProperties>({ opacity: 0 });
  const { isTransitioning } = usePageTransition();

  useReveal(rootRef);

  useEffect(() => {
    storeMode(mode);
  }, [mode]);

  useGSAP(
    () => {
      const title = titleRef.current;
      const subtitle = heroSubtitleRef.current;
      const plate = heroPlateRef.current;
      if (!title || !subtitle || !plate || isTransitioning || prefersReducedMotion()) {
        return;
      }

      const lines = title.querySelectorAll<HTMLElement>('.carte-title-line');
      gsap.fromTo(
        lines,
        { yPercent: 110 },
        { yPercent: 0, duration: 0.75, stagger: 0.08, ease: 'power4.out', clearProps: 'transform' },
      );
      gsap.fromTo(
        [subtitle, plate],
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, stagger: 0.08, delay: 0.18, ease: 'power4.out' },
      );
    },
    { scope: heroRef, dependencies: [isTransitioning], revertOnUpdate: true },
  );

  useGSAP(
    () => {
      const panel = modePanelRef.current;
      if (!panel) {
        return;
      }
      if (prefersReducedMotion()) {
        gsap.set(panel, { height: 'auto', opacity: 1 });
        return;
      }
      gsap.fromTo(
        panel,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.25, ease: 'power4.out', clearProps: 'height' },
      );
    },
    { scope: rootRef, dependencies: [mode], revertOnUpdate: true },
  );

  useGSAP(
    () => {
      const sectionElements = availableCategories
        .map((category) => categoryElements.current.get(category.id))
        .filter((element): element is HTMLElement => element !== undefined);
      if (sectionElements.length === 0) {
        return;
      }

      const triggers = sectionElements.map((element) =>
        ScrollTrigger.create({
          trigger: element,
          start: 'top 40%',
          end: 'bottom 40%',
          onEnter: () => setActiveCategory(element.dataset.menuCategory ?? ''),
          onEnterBack: () => setActiveCategory(element.dataset.menuCategory ?? ''),
        }),
      );
      const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        window.cancelAnimationFrame(refreshFrame);
        triggers.forEach((trigger) => trigger.kill());
      };
    },
    { scope: rootRef, dependencies: [mode], revertOnUpdate: true },
  );

  useEffect(() => {
    const list = tabListRef.current;
    const activeTab = tabElements.current.get(activeCategory);
    if (!list || !activeTab) {
      setIndicatorStyle({ opacity: 0 });
      return;
    }

    setIndicatorStyle({
      opacity: 1,
      width: `${activeTab.offsetWidth}px`,
      transform: `translateX(${activeTab.offsetLeft}px)`,
    });
    const activeLeft = activeTab.offsetLeft;
    const activeRight = activeLeft + activeTab.offsetWidth;
    if (activeLeft < list.scrollLeft) {
      list.scrollTo({ left: activeLeft });
    } else if (activeRight > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: activeRight - list.clientWidth });
    }
  }, [activeCategory]);

  useEffect(() => {
    const updateIndicator = (): void => {
      const list = tabListRef.current;
      const activeTab = tabElements.current.get(activeCategory);
      if (list && activeTab) {
        setIndicatorStyle({
          opacity: 1,
          width: `${activeTab.offsetWidth}px`,
          transform: `translateX(${activeTab.offsetLeft}px)`,
        });
      }
    };
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeCategory]);

  function chooseMode(nextMode: OrderMode): void {
    setMode(nextMode);
  }

  function handleModeKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number): void {
    const nextKey = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const previousKey = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
    if (!nextKey && !previousKey) {
      return;
    }

    event.preventDefault();
    const direction = nextKey ? 1 : -1;
    const nextIndex = (currentIndex + direction + 2) % 2;
    const nextMode: OrderMode = nextIndex === 0 ? 'restaurant' : 'distance';
    chooseMode(nextMode);
    rootRef.current
      ?.querySelector<HTMLButtonElement>(`[data-order-mode="${nextMode}"]`)
      ?.focus();
  }

  function scrollToCategory(categoryId: string): void {
    const element = categoryElements.current.get(categoryId);
    const tabs = tabsRef.current;
    if (!element || !tabs) {
      return;
    }

    const stickyTop = Number.parseFloat(getComputedStyle(tabs).top) || 0;
    const target = element.getBoundingClientRect().top + window.scrollY - tabs.offsetHeight - stickyTop;
    setActiveCategory(categoryId);
    scrollLenisTo(Math.max(0, target));
  }

  const openingHours = site.openingHours.monday;

  return (
    <div className="carte-page" ref={rootRef}>
      <MenuStructuredData />
      <SectionShell tone="ink" className="carte-hero" id="carte-hero">
        <section className="carte-hero-inner" ref={heroRef} aria-labelledby="carte-title">
          <div className="carte-hero-copy">
            <h1 id="carte-title" className="carte-title" ref={titleRef} data-content tabIndex={-1}>
              <span className="carte-title-line-mask"><span className="carte-title-line">La</span></span>
              <span className="carte-title-line-mask"><span className="carte-title-line">carte</span></span>
            </h1>
            <p className="carte-hero-subtitle" ref={heroSubtitleRef} data-content>
              Plats sur commande, formules et garnitures. Appelez ou écrivez-nous pour commander.
            </p>
          </div>
          <div className="carte-hero-plate" ref={heroPlateRef} data-content>
            <Plate item={canardLaque} size="clamp(360px, 30vw, 440px)" priority />
          </div>
        </section>
      </SectionShell>

      <SectionShell tone="ivory" seam="dome" className="carte-content" id="carte-content">
        <div className="carte-order">
          <h2 className="carte-order-heading" data-content data-reveal="item">
            Comment souhaitez-vous commander ?
          </h2>
          <div className="order-mode-group" role="radiogroup" aria-label="Mode de commande">
            <button
              className={`order-mode-card${mode === 'restaurant' ? ' is-selected' : ''}`}
              type="button"
              role="radio"
              aria-checked={mode === 'restaurant'}
              tabIndex={mode === 'restaurant' ? 0 : -1}
              data-order-mode="restaurant"
              data-content
              data-reveal="item"
              onClick={() => chooseMode('restaurant')}
              onKeyDown={(event) => handleModeKeyDown(event, 0)}
            >
              <QrCode aria-hidden="true" />
              <span className="order-mode-label">Je suis au restaurant</span>
              <span className="order-mode-caption">Le menu de ma table</span>
            </button>
            <button
              className={`order-mode-card${mode === 'distance' ? ' is-selected' : ''}`}
              type="button"
              role="radio"
              aria-checked={mode === 'distance'}
              tabIndex={mode === 'distance' ? 0 : -1}
              data-order-mode="distance"
              data-content
              data-reveal="item"
              onClick={() => chooseMode('distance')}
              onKeyDown={(event) => handleModeKeyDown(event, 1)}
            >
              <MessageCircle aria-hidden="true" />
              <span className="order-mode-label">Je commande à distance</span>
              <span className="order-mode-caption">WhatsApp ou appel</span>
            </button>
          </div>
          <div className="order-mode-panel" ref={modePanelRef} aria-live="polite">
            {mode === 'restaurant' ? (
              <div className="order-panel-content" data-content>
                {site.tableMenuUrl ? (
                  <>
                    <a
                      className="order-button order-button--outline"
                      href={site.tableMenuUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ouvrir le menu de ma table
                    </a>
                    <p>Réservé aux clients installés à une table.</p>
                  </>
                ) : (
                  <p>Scannez le QR code posé sur votre table pour voir le menu et commander.</p>
                )}
              </div>
            ) : (
              <div className="order-panel-content" data-content>
                <div className="order-panel-buttons">
                  <a
                    className="order-button order-button--gold"
                    href={site.whatsappLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle aria-hidden="true" size={20} />
                    Écrire sur WhatsApp
                  </a>
                  <a className="order-button order-button--outline" href={site.phoneLink}>
                    <Phone aria-hidden="true" size={20} />
                    Appeler
                  </a>
                </div>
                <p className="order-contact-details">
                  <a href={site.phoneLink}>{site.phone}</a>
                  <span>
                    Tous les jours, {formatOpeningTime(openingHours.opens)} –{' '}
                    {formatOpeningTime(openingHours.closes)}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="menu-tabs" ref={tabsRef} aria-label="Catégories de la carte">
          <div className="menu-tabs-list" ref={tabListRef}>
            {availableCategories.map((category) => {
              return (
                <MenuCategoryTab
                  key={category.id}
                  category={category}
                  active={activeCategory === category.id}
                  onSelect={() => scrollToCategory(category.id)}
                  registerElement={(element) => {
                    if (element) {
                      tabElements.current.set(category.id, element);
                    } else {
                      tabElements.current.delete(category.id);
                    }
                  }}
                />
              );
            })}
            <span className="menu-tab-indicator" style={indicatorStyle} aria-hidden="true" />
          </div>
        </nav>

        <div className="menu-layout">
          <aside className="menu-quick-access" aria-label="Accès rapide aux catégories">
            <h2>Accès rapide</h2>
            <ul>
              {availableCategories.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    className={activeCategory === category.id ? 'is-active' : ''}
                    aria-current={activeCategory === category.id ? 'location' : undefined}
                    onClick={() => scrollToCategory(category.id)}
                  >
                    <span>{category.label}</span>
                    <span>{category.items.length}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <div className="menu-category-list">
            {availableCategories.map((category) => (
              <MenuCategorySection key={category.id} category={category} mode={mode} />
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell tone="ink" seam="dome" className="carte-final-cta">
        <div className="carte-final-inner">
          <h2 data-content data-reveal="item">Une envie ?</h2>
          <div className="order-panel-buttons" data-content data-reveal="item">
            <a
              className="order-button order-button--gold"
              href={site.whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle aria-hidden="true" size={20} />
              Écrire sur WhatsApp
            </a>
            <a className="order-button order-button--light-outline" href={site.phoneLink}>
              <Phone aria-hidden="true" size={20} />
              Appeler
            </a>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}
