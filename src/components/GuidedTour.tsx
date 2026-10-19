import { useEffect, useLayoutEffect, useState } from 'react';
import { X } from 'lucide-react';
import { setTourSeen } from '@/lib/hints';
import { t } from '@/lib/i18n';

export type TourTab = 'grows' | 'overview' | 'nutrient' | 'athena' | 'shotsize' | 'backup' | 'about';

interface Step {
  id: string;
  tab?: TourTab;
  title: string;
  intro: string;
  bullets?: string[];
}

function steps(): Step[] {
  return [
    {
      id: 'welcome',
      title: t('Willkommen im Grow Manager', 'Welcome to Grow Manager'),
      intro: t(
        'Diese kurze Tour (ca. 1 Minute) zeigt dir, wo du was findest. Du kannst sie jederzeit überspringen und später über das „?“ oben rechts oder im Reiter „Über“ erneut starten.',
        'This short tour (about 1 minute) shows you where to find what. You can skip it any time and restart it later via the “?” at the top right or in the “About” tab.'
      ),
    },
    {
      id: 'grows',
      tab: 'grows',
      title: 'Grows',
      intro: t('Hier legst du deine Grows an und führst sie.', 'This is where you create and manage your grows.'),
      bullets: [
        t('Neuer Grow: Name, Sorte und Anzahl Pflanzen (1–10).', 'New grow: name, strain and number of plants (1–10).'),
        t('Im Grow ganz oben bei „Meilensteine“: Pflanzenanzahl und Daten (Start, Wachstum, Blüte, Ernte).', 'In the grow, at the top under “Milestones”: number of plants and dates (start, veg, flower, harvest).'),
        t('Weiter unten: Tagebuch, Trocknung & Ernte, Dünger-Verbrauch, Kosten & Ertrag.', 'Further down: journal, drying & harvest, fertilizer usage, costs & yield.'),
        t('Die Chips unter dem Titel springen direkt zu jedem Bereich.', 'The chips below the title jump straight to each section.'),
        t('„PDF-Bericht“ oben rechts zeigt den Bericht erst in einer Vorschau.', '“PDF report” at the top right shows the report in a preview first.'),
      ],
    },
    {
      id: 'overview',
      tab: 'overview',
      title: t('Übersicht', 'Overview'),
      intro: t('Alle Grows im Vergleich: Pflanzen, Ertrag, Kosten und Kosten pro Gramm – mit Jahresfilter und PDF-Export.', 'All grows compared: plants, yield, costs and cost per gram – with year filter and PDF export.'),
    },
    {
      id: 'nutrient',
      tab: 'nutrient',
      title: t('Nährlösung', 'Nutrient mix'),
      intro: t('Trage hier jeden angemischten Ansatz ein (Datum und Liter).', 'Log every batch you mix here (date and liters).'),
      bullets: [
        t('Der Timer erinnert dich ans Erneuern der Nährlösung.', 'The timer reminds you to renew the solution.'),
        t('Der Ansatz wird automatisch dem Grow zugeordnet, der an diesem Datum lief.', 'The batch is assigned automatically to the grow that was running on that date.'),
        t('Oben siehst du den Verbrauch je Phase (Wachstum / Blüte) in mL.', 'At the top you see the usage per phase (veg / flower) in mL.'),
      ],
    },
    {
      id: 'athena',
      tab: 'athena',
      title: t('Dünger', 'Nutrients'),
      intro: t('Wähle hier deinen Dünger (z. B. Athena) und sieh dir das Schema an.', 'Choose your fertilizer here (e.g. Athena) and look at its schedule.'),
      bullets: [t('Der gewählte Dünger wird für die Verbrauchsrechnung in „Nährlösung“ und im Grow verwendet.', 'The selected fertilizer is used for the usage calculation in “Nutrient mix” and in the grow.')],
    },
    {
      id: 'shotsize',
      tab: 'shotsize',
      title: 'Shot Size',
      intro: t('Crop-Steering-Rechner: Mediumgröße eingeben, Shotgröße für vegetativ und generativ in % und mL.', 'Crop steering calculator: enter the medium size to get the shot size for vegetative and generative in % and mL.'),
    },
    {
      id: 'backup',
      tab: 'backup',
      title: 'Backup',
      intro: t('Sichere deine Daten: automatische Tages-Backups, „Speichern unter …“ mit frei wählbarem Pfad und Import.', 'Back up your data: automatic daily backups, “Save as …” with a freely chosen path, and import.'),
      bullets: [
        t('Eine Übersicht zeigt, wo welche Backups gespeichert werden.', 'An overview shows where each backup is stored.'),
        t('Vor jedem Import oder jeder Wiederherstellung wird automatisch ein Sicherungs-Backup angelegt – nichts geht verloren.', 'Before every import or restore a safety backup is created automatically – nothing gets lost.'),
      ],
    },
    {
      id: 'about',
      tab: 'about',
      title: t('Über', 'About'),
      intro: t('Version, Entwickler und Patchnotes. Hier kannst du diese Tour jederzeit erneut starten.', 'Version, developer and patch notes. You can restart this tour here at any time.'),
      bullets: [
        t('„Alles zurücksetzen“: löscht alle Daten und stellt die App wie neu her. Vorher wird automatisch ein Backup angelegt, und du musst „RESET“ eintippen – so geht nichts aus Versehen verloren.', '“Reset everything”: deletes all data and restores the app to a fresh state. A backup is created automatically first and you have to type “RESET” – so nothing is lost by accident.'),
      ],
    },
  ];
}

interface Props {
  startTab: TourTab;
  onNavigate: (tab: TourTab) => void;
  onClose: () => void;
}

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Einführungstour: hebt die Reiter hervor und erklärt, wo was zu finden ist. */
export default function GuidedTour({ startTab, onNavigate, onClose }: Props) {
  const list = steps();
  const [initialTab] = useState(startTab); // Reiter beim Start merken, damit wir am Ende dorthin zurückkehren
  const [i, setI] = useState(0);
  const [hideNext, setHideNext] = useState(true);
  const [rect, setRect] = useState<Rect | null>(null);
  const [vw, setVw] = useState(() => window.innerWidth);
  const step = list[i];
  const last = i === list.length - 1;

  const close = () => {
    setTourSeen(hideNext);
    onNavigate(initialTab);
    onClose();
  };

  // Passenden Reiter öffnen
  useEffect(() => {
    if (step.tab) onNavigate(step.tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  // Reiter-Button vermessen
  useLayoutEffect(() => {
    const measure = () => {
      setVw(window.innerWidth);
      const el = step.tab ? (document.querySelector(`[data-tour="tab-${step.tab}"]`) as HTMLElement | null) : null;
      if (!el) return setRect(null);
      const r = el.getBoundingClientRect();
      setRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    };
    const el = step.tab ? (document.querySelector(`[data-tour="tab-${step.tab}"]`) as HTMLElement | null) : null;
    el?.scrollIntoView({ inline: 'center', block: 'nearest' });
    const id = window.setTimeout(measure, 60);
    measure();
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('resize', measure);
    };
  }, [i, step.tab]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') setI((v) => Math.min(list.length - 1, v + 1));
      if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideNext]);

  const cardW = Math.min(380, vw - 24);
  const cardStyle: React.CSSProperties = rect
    ? { top: rect.top + rect.height + 18, left: Math.min(Math.max(12, rect.left + rect.width / 2 - cardW / 2), vw - cardW - 12), width: cardW }
    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: cardW };

  return (
    <div className="fixed inset-0 z-[70]" data-testid="tour" role="dialog" aria-modal="true">
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />
      {rect ? (
        <div
          data-testid="tour-spot"
          className="absolute rounded-xl ring-2 ring-primary-400 pointer-events-none transition-all duration-300"
          style={{ left: rect.left - 6, top: rect.top - 4, width: rect.width + 12, height: rect.height + 8, boxShadow: '0 0 0 9999px rgba(2,6,15,0.8)' }}
        />
      ) : (
        <div className="absolute inset-0 bg-ink-950/80 pointer-events-none" />
      )}

      <div className="absolute rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl p-5 animate-fade-in max-h-[80vh] overflow-y-auto" style={cardStyle} data-testid="tour-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-primary-300 font-semibold" data-testid="tour-step">
              {t('Schritt', 'Step')} {i + 1} / {list.length}
            </div>
            <h3 className="text-base font-bold text-white mt-1" data-testid="tour-title">{step.title}</h3>
          </div>
          <button onClick={close} className="h-7 w-7 rounded-lg flex items-center justify-center text-ink-500 hover:text-white hover:bg-ink-800 shrink-0" aria-label={t('Tour schließen', 'Close tour')}>
            <X size={15} />
          </button>
        </div>
        <p className="text-sm text-ink-300 mt-2 leading-relaxed">{step.intro}</p>
        {step.bullets && (
          <ul className="mt-2.5 space-y-1.5">
            {step.bullets.map((b, k) => (
              <li key={k} className="text-xs text-ink-400 leading-relaxed flex gap-2">
                <span className="text-primary-400 mt-px">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        <label className="mt-4 flex items-center gap-2 text-xs text-ink-400 cursor-pointer select-none">
          <input data-testid="tour-never" type="checkbox" checked={hideNext} onChange={(e) => setHideNext(e.target.checked)} className="accent-emerald-500 h-3.5 w-3.5" />
          {t('Beim nächsten Start nicht mehr anzeigen', 'Don’t show again at the next start')}
        </label>

        <div className="mt-4 flex items-center gap-2">
          {!last && (
            <button data-testid="tour-skip" onClick={close} className="text-xs text-ink-500 hover:text-ink-200 underline underline-offset-2 mr-auto">
              {t('Überspringen', 'Skip')}
            </button>
          )}
          {last && <span className="mr-auto" />}
          {i > 0 && (
            <button data-testid="tour-prev" onClick={() => setI(i - 1)} className="px-3.5 py-2 rounded-lg text-sm font-medium text-ink-300 bg-ink-850 hover:bg-ink-800 border border-ink-700/60 transition-colors">
              {t('Zurück', 'Back')}
            </button>
          )}
          <button
            data-testid="tour-next"
            onClick={() => (last ? close() : setI(i + 1))}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 transition-colors shadow-glow"
          >
            {last ? t('Fertig', 'Done') : i === 0 ? t('Los geht’s', 'Let’s go') : t('Weiter', 'Next')}
          </button>
        </div>
      </div>
    </div>
  );
}
