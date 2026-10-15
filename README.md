# FWY mock exams

TCF Canada and TEF Canada mock exams for FrenchWithYou students.
Live site: https://frenchwithyou.github.io/Tests/

## How it works

- **The site** (this repository, published with GitHub Pages) shows the tests: listening with one play per recording, reading, writing and speaking, timed like the real exams, in French or English.
- **The results** go to a private Google Sheet, *FWY Mock Results*. Its script (`backend/Code.gs`) checks the answers, so the answer keys are never on the site. Students get their score, NCLC level and correction as soon as they finish listening or reading. Writing and speaking are marked by the teacher in the sheet.
- **Access**: each student has a personal code (tab *Students*). One attempt per test, unless *Retakes* is set to *Yes*.
- `assets/js/config.js` holds the address of the Google Sheet web app. Empty = preview mode (nothing saved).

## Adding a mock

1. Write the private source files (`co.yaml`, `ce.yaml`, `ee.yaml`, `eo.yaml`) for the new mock, e.g. `tcf-2/`.
2. `python3 tools/build.py <sources> <out>` writes `mocks/<exam>-<n>/*.json`, `mocks/catalog.json`, the keys file *FWY Keys.csv* and the recording list.
3. Import the new keys into the *Keys* tab, add the audio to `mocks/<exam>-<n>/audio/`, rebuild, publish.

A listening test opens to students only when every recording is in its `audio/` folder.

## Tools

- `tools/pictures.py`: turns an illustration (or a 2x2 collage) into the black-and-white exam pictures, 4:3, light JPEG.
- `tools/drawings.py`: the graphs of TEF reading Q22.
- `tools/audio_scripts_pdf.py`: the teacher's recording sheet.
- `tools/dev/server.js`: runs the site with `backend/Code.gs` on a fake sheet, for testing.

Fonts: Bricolage Grotesque and Literata (SIL Open Font License, see `assets/fonts/`).
The site has a light and a dark theme (button in the top bar) and shows levels on the NCLC or the CECR scale.
