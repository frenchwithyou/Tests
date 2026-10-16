# FWY mock exams

TCF Canada and TEF Canada mock exams for FrenchWithYou students.
Live site: https://frenchwithyou.github.io/Tests/

## How it works

- **The site** (this repository, published with GitHub Pages) shows the tests: listening with one play per recording, reading, writing and speaking, timed like the real exams, in French or English.
- **The results** go to a private Google Sheet, *FWY Mock Results*. Its script (`backend/Code.gs`) checks the answers, so the answer keys are never on the site. Students get their score, NCLC level and correction as soon as they finish listening or reading. Writing and speaking are marked by the teacher in the sheet.
- **Access**: each student has a personal code (tab *Students*). One attempt per test, unless *Retakes* is set to *Yes*.
- `assets/js/config.js` holds the address of the Google Sheet web app. Empty = preview mode (nothing saved).

## Adding a mock

1. Write the private source files (`co.yaml`, `ce.yaml`, `ee.yaml`, `eo.yaml`) for the new mock, e.g. `tcf-2/`. In `co.yaml`, each screen gives its voices: `voice: n` (one voice) or `cast: {LABEL: n}` (a dialogue).
2. `python3 tools/build.py <sources> <out>` writes `mocks/<exam>-<n>/*.json`, updates `mocks/catalog.json` (other mocks are kept as they are) and writes the keys file *FWY Keys.csv* and the recording list for the mocks in `<sources>` only.
3. Publish. Writing and speaking open at once. Reading stays "coming soon" while its `ce.yaml` says `hold: true`: import the keys into the *Keys* tab (File → Import → Upload → *Append to current sheet*), remove the line, rebuild, publish.
4. `python3 tools/tts_blocks.py <sources> <out> tcf-2 tef-2` makes the text-to-speech blocks (one voice each, under 1,000 characters) and the plan to cut the recordings back into clips. A listening test opens to students only when every recording is in its `audio/` folder.

The four voices are the same in every mock: 1 and 3 are women, 2 and 4 are men.

## Tools

- `tools/pictures.py`: turns an illustration (or a 2x2 collage) into the black-and-white exam pictures, 4:3, light JPEG.
- `tools/drawings.py`: the graphs of TEF reading Q22 and the clocks of TEF 2 listening Q3.
- `tools/tts_blocks.py`: the text-to-speech blocks for the listening recordings.
- `tools/audio_scripts_pdf.py`: the teacher's recording sheet.
- `tools/dev/server.js`: runs the site with `backend/Code.gs` on a fake sheet, for testing.

Fonts: Bricolage Grotesque and Literata (SIL Open Font License, see `assets/fonts/`).
The site has a light and a dark theme (button in the top bar) and shows levels on the NCLC or the CECR scale.
