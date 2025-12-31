# Design system starter

- Tokens live in `design/colors.ts`, `design/spacing.ts`, and `design/typography.ts`.
- Base primitives in `components/design/`:
  - `Screen` wraps SafeAreaView and background.
  - `Text` applies variants from typography tokens.
  - `Button` supports primary/ghost/danger tones plus loading.
  - `Card` gives glassy surfaces.
  - `Input` handles label + styled TextInput.
- Import with the root alias: `import { Button } from "@/components/design/Button";`

This keeps TSX lean while preserving the existing Firebase/data logic. Extend tokens to evolve the brand (e.g., add gradients or dark/light switches).
