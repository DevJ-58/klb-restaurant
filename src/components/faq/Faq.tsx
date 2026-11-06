import { useState, type ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import { SectionShell } from '../layout/SectionShell';
import { SectionTitle } from '../ui/SectionTitle';

export type FaqItem = {
  question: string;
  answer: ReactNode;
  answerText: string;
};

type FaqProps = {
  items: readonly FaqItem[];
};

export function Faq({ items }: FaqProps) {
  const [openItems, setOpenItems] = useState<ReadonlySet<number>>(() => new Set());

  const toggleItem = (index: number): void => {
    setOpenItems((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <SectionShell
      className="faq-section"
      bgStart="ivory"
      bgEnd="ivory"
      seam="dome"
      prevBg="surface-raised"
      data-surface="light"
      aria-labelledby="faq-title"
    >
      <SectionTitle id="faq-title" className="faq-title">
        Questions fréquentes
      </SectionTitle>
      <div className="faq-list">
        {items.map(({ question, answer }, index) => {
          const isOpen = openItems.has(index);
          const buttonId = `faq-question-${index + 1}`;
          const panelId = `faq-answer-${index + 1}`;

          return (
            <article className="faq-item" key={question}>
              <h3 className="faq-question-heading">
                <button
                  className="faq-question-button"
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  data-content
                  onClick={() => toggleItem(index)}
                >
                  <span>{question}</span>
                  {isOpen ? (
                    <Minus aria-hidden="true" size={22} />
                  ) : (
                    <Plus aria-hidden="true" size={22} />
                  )}
                </button>
              </h3>
              <div
                className={`faq-panel${isOpen ? ' is-open' : ''}`}
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                aria-hidden={!isOpen}
                inert={!isOpen}
              >
                <div className="faq-panel-inner">
                  <div className="faq-answer">{answer}</div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </SectionShell>
  );
}
