import { Info, User, Github, Mail, Leaf, ShieldCheck, ListOrdered } from 'lucide-react';
import { APP_NAME, APP_VERSION, CHANGELOG, DEVELOPER } from '@/lib/appInfo';
import { t, isEn } from '@/lib/i18n';
import { resetHints } from '@/lib/hints';

export default function AboutPanel({ onStartTour }: { onStartTour?: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Info size={18} className="text-primary-400" />
          {t('Über', 'About')}
        </h2>
        <p className="text-sm text-ink-500 mt-0.5">
          {t('Infos zur App, zum Entwickler und zu den Änderungen.', 'Info about the app, the developer and the changes.')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* App */}
        <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow">
              <Leaf size={22} className="text-ink-950" />
            </div>
            <div>
              <div className="font-bold text-white text-lg leading-tight">{APP_NAME}</div>
              <div className="text-xs text-ink-500 tabular-nums" data-testid="about-version">
                {t('Version', 'Version')} {APP_VERSION}
              </div>
            </div>
          </div>
          <p className="text-sm text-ink-400 mt-4 leading-relaxed">
            {t(
              'Dein persönlicher Grow-Manager: Meilensteine, Tagebuch, Nährlösung, Dünger-Schemata, Backups und der Crop-Steering-Shot-Size-Rechner an einem Ort.',
              'Your personal grow manager: milestones, journal, nutrient solution, fertilizer schedules, backups and the crop steering shot size calculator in one place.'
            )}
          </p>
          <div className="flex gap-2.5 mt-4 text-xs text-ink-500 leading-relaxed">
            <ShieldCheck size={15} className="text-primary-400 shrink-0 mt-0.5" />
            <span>
              {t(
                'Alle Daten bleiben lokal auf deinem Gerät. Es werden keine Daten an Server gesendet.',
                'All data stays local on your device. No data is sent to any server.'
              )}
            </span>
          </div>
        </div>

        {/* Entwickler */}
        <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
          <div className="text-xs font-semibold uppercase tracking-widest text-ink-500 mb-3">
            {t('Entwickler', 'Developer')}
          </div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-ink-800 border border-ink-700 flex items-center justify-center text-ink-300">
              <User size={22} />
            </div>
            <div>
              <div className="font-semibold text-white" data-testid="dev-name">{DEVELOPER.name}</div>
              <div className="text-xs text-ink-500">{DEVELOPER.role()}</div>
            </div>
          </div>
          {(DEVELOPER.github || DEVELOPER.contact) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {DEVELOPER.github && (
                <a
                  href={DEVELOPER.github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-ink-300 bg-ink-850 hover:bg-ink-800 border border-ink-700/60 transition-colors"
                >
                  <Github size={15} /> GitHub
                </a>
              )}
              {DEVELOPER.contact && (
                <a
                  href={`mailto:${DEVELOPER.contact}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-ink-300 bg-ink-850 hover:bg-ink-800 border border-ink-700/60 transition-colors"
                >
                  <Mail size={15} /> {t('Kontakt', 'Contact')}
                </a>
              )}
            </div>
          )}
          <p className="text-xs text-ink-600 mt-4">
            {t('Gebaut mit React, Tailwind CSS und Tauri. Erstellt mit Bolt.new.', 'Built with React, Tailwind CSS and Tauri. Created with Bolt.new.')}
          </p>
        </div>
      </div>

      {/* Einführung / Hinweise */}
      {onStartTour && (
        <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">{t('Einführung & Hinweise', 'Tour & hints')}</div>
            <p className="text-xs text-ink-500 mt-0.5">
              {t('Zeigt dir in einer kurzen Tour, wo du was findest. Ausgeblendete Hinweis-Karten kannst du hier wieder einblenden.', 'A short tour showing you where to find what. Hidden hint cards can be shown again here.')}
            </p>
          </div>
          <div className="flex gap-2">
            <button data-testid="restart-tour" onClick={onStartTour} className="px-3.5 py-2 rounded-lg text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 transition-colors shadow-glow">
              {t('Tour starten', 'Start tour')}
            </button>
            <button data-testid="reset-hints" onClick={resetHints} className="px-3.5 py-2 rounded-lg text-sm font-medium text-ink-300 bg-ink-850 hover:bg-ink-800 border border-ink-700/60 transition-colors">
              {t('Hinweise wieder einblenden', 'Show hints again')}
            </button>
          </div>
        </div>
      )}

      {/* Patchnotes */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink-500 mb-4">
          <ListOrdered size={14} /> {t('Patchnotes', 'Patch notes')}
        </div>
        <div className="space-y-5">
          {CHANGELOG.map((entry) => (
            <div key={entry.version}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tabular-nums">v{entry.version}</span>
                {entry.version === APP_VERSION && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-primary-300 bg-primary-500/10 border border-primary-500/30">
                    {t('Aktuell', 'Current')}
                  </span>
                )}
              </div>
              <ul className="mt-2 space-y-1.5">
                {entry.items.map((it, i) => (
                  <li key={i} className="text-sm text-ink-400 flex gap-2">
                    <span className="text-ink-600">•</span>
                    <span>{isEn() ? it.en : it.de}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
