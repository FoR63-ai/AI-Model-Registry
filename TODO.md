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

## 5. Datasets tab

A second catalogue for datasets that works the same way as the models one:
search, filters, detail pages, submit/edit/delete via GitHub issues.

Decisions so far:
- **Placement:** "Models | Datasets" tabs on the front page, each with its own
  table, search and filters. The selected tab goes in the URL (e.g.
  `index.html#datasets`) so links to it work.
- **Approval:** same flow and same approvers as models (submit form opens a
  GitHub issue, a maintainer applies `approved` / `update-approved` /
  `delete-approved`).
- **Linking:** both ways. A model lists the datasets it was trained on, and a
  dataset's detail page shows the models trained on it.

Proposed fields (draft — adjust before building):

| Field | Notes |
|---|---|
| Dataset name * | |
| Organisation * | Same drop-down as models |
| Data type * | Drop-down: Raster imagery, Point cloud, Elevation model, Vector, Text/documents, Other |
| Description | What it contains and what it's for |
| Source / sensor | e.g. aerial camera, ALS LiDAR, Sentinel-2 |
| Spatial coverage | Country/region, optionally a bounding box |
| Time period | Acquisition year(s) |
| Resolution | Ground sampling distance, or point density for point clouds |
| Coordinate reference system | EPSG code |
| Format | e.g. GeoTIFF, LAS/LAZ, GeoPackage |
| Size | Area, number of tiles or GB |
| Annotations | Label type (masks, bounding boxes, point labels) and classes, if any |
| License | Same drop-down as models |
| Access link | |
| More information | |
| Last updated | Set automatically, like models |
| Tags | Same tag list as models (item 4) |

\* required

Work involved:
- [ ] Agree the field list above.
- [ ] `data/datasets/*.json`, a `data/datasets.json` index, a
      `schema/dataset.schema.json`, and validation — extend
      `scripts/build-index.mjs` and `scripts/validate-models.mjs` rather than
      copying them.
- [ ] Tabs on `index.html`; a dataset detail page.
- [ ] Submit/edit/delete form for datasets. The GitHub issue must say whether
      it's a model or a dataset so the approval workflow writes to the right
      folder; extend `approve-model.yml` and `rebuild-index.yml` to handle
      `data/datasets/`.
- [ ] Linking: add a "Training datasets" field to models (a pick-list of
      registered datasets). Store the link on the model side only, and have
      the dataset page work out "models trained on this" from that — one
      source of truth, nothing to keep in sync.
- [ ] A datasets section on the guidance page.
- [ ] Items 1, 2 and 4 (drop-downs, info icons, tags) apply to datasets too.
      For item 3, also evaluate **OGC TrainingDML-AI**, **Croissant** (ML
      dataset metadata) and **GeoDCAT-AP** for the dataset fields — they fit
      datasets better than models.

## Notes

- After any change to `js/*.js`, bump the `?v=` version on the script tags in
  `index.html` and `detail.html` (see the comment there), or visitors with a
  cached copy will see errors.
- Items 1 and 4 both change the data format — doing the data clean-up in one
  pass for both avoids touching every model file twice.
