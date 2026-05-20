# On Your Feet

A dead-simple stand-up reminder for desk workers.

Start a timer. When it ends, you hear a couple of soft beeps and an OS notification. You either snooze for 5 more minutes or hit **I'm standing up** — which starts a 5-minute standing timer. When that's done you hit start again. No streaks, no charts, no schedule editor, no login.

**Live:** <https://onyourfeet.app>

## Why this exists

There's real research behind it — see [the Why page](https://onyourfeet.app/en/why) for the actual citations.

Short version: Duran/Diaz et al. (2023, _Medicine & Science in Sports & Exercise_) tested five sitting-break patterns in a randomized crossover trial. Only one — **5 minutes of light walking every 30 minutes** — significantly reduced both post-meal blood sugar and blood pressure. A separate 2016 _Lancet_ meta-analysis (1M+ people) found that prolonged sitting carries health risk that typical exercise levels don't fully offset. This app implements that specific dose with zero ceremony.

The page deliberately avoids the popular-press framing of "5 minutes beats an hour at the gym" — that's not what the research says.

## Stack

- [SvelteKit](https://svelte.dev/) (Svelte 5 runes) + TypeScript
- [Tailwind v4](https://tailwindcss.com/) with class-based dark mode
- [Paraglide v2](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) for i18n (13 languages)
- [Cloudflare Workers](https://workers.cloudflare.com/) via `@sveltejs/adapter-cloudflare`
- [Playwright](https://playwright.dev/) for end-to-end tests

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
npm run test:e2e     # full Playwright suite
npm run check        # type check
npm run build        # production build
```

**Fast-test mode:** append `?dev=1` to any page (only respected in `npm run dev`, not in production). Work presets become `[1, 5, 10]` _seconds_ and the snooze/stand cycles drop to 1 second each, so you can exercise the whole state machine in seconds instead of minutes.

## Internationalization

Supported locales: `en` (base), `es`, `pt`, `fr`, `de`, `it`, `nl`, `pl`, `ru`, `ja`, `ko`, `zh`, `hi`.

URL strategy: every route lives at `/<locale>/...`. Visiting `/` redirects to the locale matched by the browser's `Accept-Language` header, with a manual override available via the language picker in the top-right.

The 12 non-English files in `messages/` were initially machine-generated. **Native-speaker PRs are very welcome** — Hindi medical-research prose in particular needs eyes. Each language file has the same key set as `messages/en.json`; just edit the values you want to improve and open a PR.

## Tests

Around 30 Playwright tests cover the timer state machine, theme toggle, language switcher, locale routing, translation notice behavior, and color-scheme rendering. See `e2e/`.

The `?dev=1` fast-test mode is what makes the full-cycle tests run in a few seconds rather than half an hour.

## Deploying

Wrangler is pinned to a specific Cloudflare account via `account_id` in `wrangler.jsonc`. To deploy your own copy:

1. Replace `account_id` with yours, or remove the field and `wrangler login` first.
2. Pick a unique Worker name in `wrangler.jsonc` (`name`).
3. `npm run build && npx wrangler deploy`.

## License

[AGPL-3.0-or-later](./LICENSE).

If you modify the code and run it as a network service that other people use, you must publish your modifications under the same license. Personal use of the public site at `onyourfeet.app` doesn't require anything from you.
