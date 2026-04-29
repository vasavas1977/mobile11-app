# Multi-Language Translation Playbook

## Adding a New Language

1. **Copy the template**: `cp src/locales/_template.json src/locales/XX.json` (replace XX with ISO 639-1 code)
2. **Translate all `[TRANSLATE]` values** in the new file
3. **Register in `LanguageContext.tsx`**:
   - Add to `Language` type: `'en' | 'th' | 'ja' | 'XX'`
   - Import: `import xx from '@/locales/xx.json'`
   - Add to `translations`: `{ en, th, ja, xx }`
   - Add to `LANGUAGE_OPTIONS` array
   - Optionally add geo-detection in the `useEffect`
4. **Add currency** (if needed): Update `Currency` type, `CURRENCY_OPTIONS`, and `EXCHANGE_RATES` in `currencyUtils.ts`
5. **Test**: Switch language in the header dropdown and verify all pages

## Rules

- **NEVER** use inline ternaries like `language === 'th' ? '...' : '...'`
- **ALWAYS** use `t('section.key')` for all user-facing strings
- Add the key to **all** locale files (en, th, ja, and any future ones)
- Use `{placeholder}` syntax for dynamic values, then `.replace('{placeholder}', value)` in the component

## Key Naming Conventions

- Use dot notation: `section.subsection.key`
- Section names match feature areas: `header`, `footer`, `landing`, `checkout`, `referralPage`, etc.
- Keep keys camelCase: `referralPage.hero.titleHighlight`
- Group related keys under common parents

## Currency-Dependent Values

For values that change by currency (e.g., reward amounts), compute the display value in the component and use `{reward}` placeholders in locale strings.
