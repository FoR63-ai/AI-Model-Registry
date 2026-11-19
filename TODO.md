# TODO — planned updates

Backlog of improvements to the registry. Tick items off as they land.

## 1. Drop-down lists and selections instead of free text

Free text has already produced inconsistent values in `data/models/`, which
breaks filtering (the Status filter shows `In production` and `In Production`
as separate options):

| Field | Values seen today |
|---|---|
| Model status | `In production` (11), `Produktion` (3), `In Production` (1), `Experimental`, `Validated` |
| AI task | `Semantic segmentation`, `Semantic Segmentation`, `Semantic segmentation.`, `point cloud semantic segmetnation`, plus long one-off descriptions |
| License | 11 empty; restrictions written five different ways (`Model only for internal use`, `Not public available`, …) |

- [ ] **Model status** → fixed drop-down using the vocabulary already on the
      guidance page: Concept, Experimental, Validated, Production-ready,
      In production, Deprecated.
- [ ] **AI task** → drop-down of the guidance page's task types (Image
      classification, Semantic segmentation, Object detection, Change detection,
      Super-resolution, Document understanding) plus point-cloud
      classification/segmentation, and an "Other" option that reveals a text box.
- [ ] **Organisation** → drop-down of existing organisations, with "Other" for
      new ones.
- [ ] **License** → common licenses (MIT, Apache-2.0, AGPL-3.0, CC-BY-4.0,
      Etalab-2.0, …) plus "Not available for external use" and "Other".
- [ ] **Architecture** → keep free text, but suggest existing values as you type.
- [ ] Clean up the existing records to match the new vocabularies (e.g.
      `Produktion` → `In production`), otherwise the drop-downs and old data
      won't line up.
- [ ] Make `scripts/validate-models.mjs` reject values outside the
      vocabularies, so new inconsistencies can't creep back in.

## 2. Info (i) on each field + example placeholders

- [ ] Add an (i) icon next to each field in the submit/edit form that shows the
      matching section of `metadata-guidance.html` (sections 1–12 map
      one-to-one to the form fields).
- [ ] Put an example in every text field's placeholder. The guidance page
      already has some (Model name: "Buildings detection", Organisation:
      "Lantmäteriet", Architecture: "U-Net convolutional neural network"); write
      examples for the fields that have none (input/output specification,
      training data origin, performance metric, access link, more information).
- [ ] Keep the guidance text in one place (shared between the guidance page and
      the tooltips) so the two can't drift apart.

## 3. Check applicable standards (OGC and others)

Evaluate whether the metadata fields should align with, or be exportable to:

- [ ] **STAC Machine Learning Model (MLM) extension** — describes a model's
      inputs (bands, tile size), outputs, architecture and framework; the
      closest match to this registry's fields.
- [ ] **OGC TrainingDML-AI** (Training Data Markup Language for AI) — for
      describing training data (our "Training data origin" field).
- [ ] **OGC API – Records** — for exposing the catalogue as a standard,
      machine-readable API other catalogues can harvest.
- [ ] **ISO 19115** (geographic metadata) and **ISO 19157** (data quality —
      relevant to "Primary performance metric").
- [ ] **SPDX license identifiers** — standard names for the License drop-down.
- [ ] Check with the **OGC GeoAI Domain Working Group** whether other
      agencies already use a profile we should follow.

Outcome: a short recommendation of which (if any) to adopt, and which field
changes that would mean.

## 4. Searchable tags for recurring terms

- [ ] Add a `tags` field to models (e.g. `RGB`, `LiDAR`, `DSM`, `DEM`,
      `Orthophoto`, `Point cloud`, `Sentinel-2`, `Aerial`, `Building`, `Road`).
- [ ] Tag picker in the submit/edit form from a fixed tag list (so it's `LiDAR`
      everywhere, not `Lidar` / `LIDAR`), with suggestions based on what's
      written in the input specification.
- [ ] Clickable tag chips on the index page and detail page that filter the
      table.
- [ ] Back-fill tags on the existing models.
- [ ] Add `tags` to `schema/model.schema.json`, `scripts/validate-models.mjs`
      and `js/common.js` (the validator rejects unknown fields).

## Notes

- After any change to `js/*.js`, bump the `?v=` version on the script tags in
  `index.html` and `detail.html` (see the comment there), or visitors with a
  cached copy will see errors.
- Items 1 and 4 both change the data format — doing the data clean-up in one
  pass for both avoids touching every model file twice.
