import de from '../../messages/de.json';
import en from '../../messages/en.json';
import es from '../../messages/es.json';
import fr from '../../messages/fr.json';
import hi from '../../messages/hi.json';
import it from '../../messages/it.json';
import ja from '../../messages/ja.json';
import ko from '../../messages/ko.json';
import nl from '../../messages/nl.json';
import pl from '../../messages/pl.json';
import pt from '../../messages/pt.json';
import ru from '../../messages/ru.json';
import zh from '../../messages/zh.json';

/**
 * The canonical message-key set, derived from `messages/en.json`.
 * Use this as the source of truth for any code that wants to type-check
 * a message-key string.
 */
export type MessageKey = keyof typeof en;

/**
 * Compile-time guard: every non-English locale must define every key present
 * in en.json. If a locale is missing a key, TypeScript reports it during
 * `npm run check` (svelte-check / tsc) and the CI workflow fails before
 * merge.
 *
 * To add a new locale: drop a new `messages/<code>.json` file, import it
 * above, and add the variable to the object below.
 *
 * Note: extra keys in a non-English file are NOT flagged here (they'd just
 * be unused) — only MISSING keys are caught. That's the practical concern.
 */
const _typecheck: Record<string, typeof en> = {
	es,
	pt,
	fr,
	de,
	it,
	nl,
	pl,
	ru,
	ja,
	ko,
	zh,
	hi
};
void _typecheck;
