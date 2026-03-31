Simplified setup with issue approval
===================================

Goal:
- Keep one JSON file per model in data/models/
- Remove generated registry files and the build step
- Let the site read directly from data/models/ via the GitHub Contents API
- Keep the submit-model workflow based on GitHub issues and approval labels

What changes:
- index.html and detail.html are replaced with simpler pages.
- js/data-loader.js reads directly from data/models/.
- js/submit.js still opens a prefilled GitHub issue with the model JSON.
- .github/workflows/approve-model.yml is kept, but rewritten so it writes only to data/models/ and does not regenerate any data/generated files.
- package.json keeps only the validate script.
- scripts/validate-models.mjs still validates all model JSON files in data/models/.

Approval flow:
1. A user clicks Submit model and opens a GitHub issue.
2. The issue contains a JSON code block with the proposed model.
3. A maintainer adds the label approved to create a new model, or update-approved to replace an existing one.
4. The workflow writes the JSON file to data/models/, runs validation, commits the change, comments on the issue, and closes it.

After copying these files into the repo:
1. Delete the files listed in DELETE_THESE_FILES.txt
2. Make sure the repo has the labels approved and update-approved
3. Commit and push
4. GitHub Pages will read directly from data/models/
