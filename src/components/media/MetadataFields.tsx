import type { SeriesType } from "@prisma/client";

export type Category = { id: string; name: string };

const SERIES_TYPES: SeriesType[] = ["ANIME", "MANGA", "OTHER"];
const fieldClasses =
  "w-full rounded-sm border border-white/15 bg-void px-3 py-2 text-sm text-moonlight placeholder:text-ash focus:outline-none";

/**
 * The tags/character/series/categories fields shared by the post-upload
 * editor (Phase 7) and the upload form itself (Phase 9) — same shape either
 * time, so it's one component instead of two copies drifting apart.
 */
export function MetadataFields({
  tags,
  onTagsChange,
  character,
  onCharacterChange,
  series,
  onSeriesChange,
  seriesType,
  onSeriesTypeChange,
  categories,
  categoryIds,
  onToggleCategory,
}: {
  tags: string;
  onTagsChange: (value: string) => void;
  character: string;
  onCharacterChange: (value: string) => void;
  series: string;
  onSeriesChange: (value: string) => void;
  seriesType: SeriesType;
  onSeriesTypeChange: (value: SeriesType) => void;
  categories: Category[];
  categoryIds: string[];
  onToggleCategory: (id: string) => void;
}) {
  return (
    <>
      <div>
        <label htmlFor="tags" className="mb-1.5 block text-sm font-bold text-moonlight">
          Tags
        </label>
        <input
          id="tags"
          value={tags}
          onChange={(e) => onTagsChange(e.target.value)}
          placeholder="comma, separated, tags"
          className={fieldClasses}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="character" className="mb-1.5 block text-sm font-bold text-moonlight">
            Character
          </label>
          <input
            id="character"
            value={character}
            onChange={(e) => onCharacterChange(e.target.value)}
            placeholder="Character name"
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="series" className="mb-1.5 block text-sm font-bold text-moonlight">
            Anime / manga series
          </label>
          <div className="flex gap-2">
            <input
              id="series"
              value={series}
              onChange={(e) => onSeriesChange(e.target.value)}
              placeholder="Series name"
              className={fieldClasses}
            />
            <select
              value={seriesType}
              onChange={(e) => onSeriesTypeChange(e.target.value as SeriesType)}
              className="rounded-sm border border-white/15 bg-void px-2 py-2 text-sm text-moonlight focus:outline-none"
            >
              {SERIES_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-bold text-moonlight">Categories</span>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-1.5 text-sm text-ash">
              <input
                type="checkbox"
                checked={categoryIds.includes(cat.id)}
                onChange={() => onToggleCategory(cat.id)}
                className="accent-cherry"
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
