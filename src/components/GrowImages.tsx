import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Grow, GrowImage } from '@/types';
import { deleteImage, prepareImage, putImage, useImageUrl } from '@/lib/imageStore';
import { localToday } from '@/lib/nutrientLogic';
import { formatDate } from '@/lib/growLogic';
import ConfirmDialog from './ConfirmDialog';
import { t } from '@/lib/i18n';

interface Props {
  grow: Grow;
  onChange: (images: GrowImage[] | undefined) => void;
}

/** Bilder am Grow: werden als Kopie lokal gespeichert und in Backup-Dateien mitgesichert. */
export default function GrowImages({ grow, onChange }: Props) {
  const images = [...(grow.images ?? [])].sort((a, b) => (b.date ?? b.addedAt).localeCompare(a.date ?? a.addedAt));
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<GrowImage | null>(null);

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    const added: GrowImage[] = [];
    const failed: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        failed.push(file.name);
        continue;
      }
      try {
        const p = await prepareImage(file);
        const id = crypto.randomUUID();
        await putImage(id, p.dataUrl);
        const lm = file.lastModified ? new Date(file.lastModified) : null;
        const date = lm && !Number.isNaN(lm.getTime())
          ? `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, '0')}-${String(lm.getDate()).padStart(2, '0')}`
          : localToday();
        added.push({ id, name: file.name, addedAt: new Date().toISOString(), date, width: p.width, height: p.height, bytes: p.bytes });
      } catch {
        failed.push(file.name);
      }
    }
    if (added.length) onChange([...(grow.images ?? []), ...added]);
    if (failed.length) setError(t(`Konnte nicht gelesen werden: ${failed.join(', ')}`, `Could not be read: ${failed.join(', ')}`));
    setBusy(false);
  };

  const update = (id: string, patch: Partial<GrowImage>) => {
    onChange((grow.images ?? []).map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const remove = async (img: GrowImage) => {
    const rest = (grow.images ?? []).filter((i) => i.id !== img.id);
    onChange(rest.length ? rest : undefined);
    setViewIndex(null);
    try {
      await deleteImage(img.id);
    } catch {
      /* ignore */
    }
  };

  return (
    <div data-testid="grow-images">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Camera size={17} className="text-primary-400" />
            {t('Bilder', 'Photos')}
            {images.length > 0 && <span className="text-xs font-medium text-ink-500">({images.length})</span>}
          </h3>
          <p className="text-xs text-ink-500 mt-0.5 max-w-xl leading-relaxed">
            {t(
              'Bilder werden als Kopie in der App gespeichert (verkleinert auf max. 1600 px) und in Backup-Dateien mitgesichert – sie bleiben sichtbar, auch wenn das Original verschoben oder gelöscht wird.',
              'Photos are stored as a copy inside the app (resized to max. 1600 px) and included in backup files – they stay visible even if the original is moved or deleted.'
            )}
          </p>
        </div>
        <button
          type="button"
          data-testid="image-add"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 disabled:opacity-60 transition-colors"
        >
          <ImagePlus size={16} />
          {busy ? t('Wird gespeichert …', 'Saving …') : t('Bilder hinzufügen', 'Add photos')}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          data-testid="image-input"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files;
            void addFiles(f).finally(() => {
              e.target.value = '';
            });
          }}
        />
      </div>

      {error && <p className="text-xs text-error-300 mb-3">{error}</p>}

      {images.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-2xl border border-dashed border-ink-700/70 bg-ink-900/40 px-4 py-8 text-sm text-ink-500 hover:text-ink-300 hover:border-ink-600 transition-colors"
        >
          {t('Noch keine Bilder – klicke hier, um Fotos von deinen Pflanzen hinzuzufügen.', 'No photos yet – click here to add photos of your plants.')}
        </button>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <Thumb key={img.id} img={img} onOpen={() => setViewIndex(i)} />
          ))}
        </div>
      )}

      {viewIndex !== null && images[viewIndex] && (
        <Lightbox
          images={images}
          index={viewIndex}
          onIndex={setViewIndex}
          onClose={() => setViewIndex(null)}
          onUpdate={update}
          onDelete={(img) => {
            setViewIndex(null); // Großansicht schließen, damit die Rückfrage sichtbar und bedienbar ist
            setToDelete(img);
          }}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={t('Bild löschen?', 'Delete photo?')}
        message={t('Das Bild wird aus diesem Grow und aus dem App-Speicher entfernt.', 'The photo is removed from this grow and from the app storage.')}
        confirmLabel={t('Löschen', 'Delete')}
        cancelLabel={t('Abbrechen', 'Cancel')}
        destructive
        onConfirm={() => {
          if (toDelete) void remove(toDelete);
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function Thumb({ img, onOpen }: { img: GrowImage; onOpen: () => void }) {
  const url = useImageUrl(img.id);
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="image-thumb"
      className="group relative aspect-square rounded-xl overflow-hidden border border-ink-800 bg-ink-850 text-left"
    >
      {url ? (
        <img src={url} alt={img.caption ?? img.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-[11px] text-ink-500 p-2 text-center">
          {url === null ? t('Bild nicht vorhanden', 'Image missing') : t('Lädt …', 'Loading …')}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
        <div className="text-[11px] font-medium text-white truncate">{img.caption || (img.date ? formatDate(img.date) : img.name)}</div>
      </div>
    </button>
  );
}

function Lightbox({
  images,
  index,
  onIndex,
  onClose,
  onUpdate,
  onDelete,
}: {
  images: GrowImage[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<GrowImage>) => void;
  onDelete: (img: GrowImage) => void;
}) {
  const img = images[index];
  const url = useImageUrl(img.id);
  const [caption, setCaption] = useState(img.caption ?? '');
  useEffect(() => setCaption(img.caption ?? ''), [img.id, img.caption]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
      if (e.key === 'ArrowRight' && index < images.length - 1) onIndex(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, images.length, onClose, onIndex]);

  return (
    <div className="fixed inset-0 z-[80] bg-black/90 flex flex-col" data-testid="lightbox" onClick={onClose}>
      <div className="flex items-center justify-between gap-2 px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="text-sm text-ink-300 truncate">
          {index + 1} / {images.length} · {img.name}
          {img.width && img.height ? ` · ${img.width}×${img.height}` : ''}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" data-testid="lightbox-delete" onClick={() => onDelete(img)} className="h-9 w-9 rounded-lg flex items-center justify-center text-ink-300 hover:text-error-400 hover:bg-white/10" title={t('Löschen', 'Delete')}>
            <Trash2 size={17} />
          </button>
          <button type="button" data-testid="lightbox-close" onClick={onClose} className="h-9 w-9 rounded-lg flex items-center justify-center text-ink-300 hover:text-white hover:bg-white/10" title={t('Schließen', 'Close')}>
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center gap-2 px-2">
        <button
          type="button"
          disabled={index === 0}
          onClick={(e) => {
            e.stopPropagation();
            onIndex(index - 1);
          }}
          className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 disabled:opacity-20"
          aria-label={t('Vorheriges Bild', 'Previous photo')}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0 h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          {url ? <img src={url} alt={img.caption ?? img.name} className="max-h-full max-w-full object-contain rounded-lg" /> : <span className="text-ink-500 text-sm">{url === null ? t('Bild nicht vorhanden', 'Image missing') : t('Lädt …', 'Loading …')}</span>}
        </div>
        <button
          type="button"
          disabled={index >= images.length - 1}
          onClick={(e) => {
            e.stopPropagation();
            onIndex(index + 1);
          }}
          className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 disabled:opacity-20"
          aria-label={t('Nächstes Bild', 'Next photo')}
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="px-4 py-3 grid sm:grid-cols-[1fr_auto] gap-2 max-w-3xl w-full mx-auto" onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={caption}
          data-testid="lightbox-caption"
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => caption !== (img.caption ?? '') && onUpdate(img.id, { caption: caption.trim() || undefined })}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          placeholder={t('Beschreibung (z. B. Woche 3 Blüte)', 'Caption (e.g. flower week 3)')}
          className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-primary-500/60"
        />
        <input
          type="date"
          value={img.date ?? ''}
          data-testid="lightbox-date"
          onChange={(e) => e.target.value && onUpdate(img.id, { date: e.target.value })}
          className="bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100"
        />
      </div>
    </div>
  );
}
