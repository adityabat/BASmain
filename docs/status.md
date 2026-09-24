# Documentation status

| Item | Status |
|---|---|
| Architecture | Word: `docs/word/BAS_Agentic_Architecture.docx` |
| Design | Word: `docs/word/BAS_Agentic_Design.docx` |
| Code map | Word: `docs/word/BAS_Agentic_Code_Map.docx` |
| Combined download | `docs/word/BAS_Agentic_Architecture_Design_and_Code_Map.docx` |
| Technical contracts (markdown) | `docs/technical.md` |
| n8n workflow JSON export | Missing — maintain in n8n Cloud until exported here |

When you change webhook URLs, payload fields, or plan limits, update `architecture.md`, `code-map.md`, `technical.md`, and `design.md` in the same change.

**Current:** Landing page visual system follows the Home page V3 direction (light navy, digital-employee hero, product cards, trust band). Logo, sign-in, product workspaces, theme toggle, and the appointment form are unchanged in behaviour. YouTube transcript SPA calls the n8n production webhook `https://m-objectsai.app.n8n.cloud/webhook/fetch` (`TRANSCRIPT_WEBHOOK` in `TranscriptExtractor.tsx`).
