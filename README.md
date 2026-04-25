# google-forms-field-extractor

Browser automation toolkit for Google Forms — extract form fields, entry IDs, and question types. No API keys required.

## What it does

The script opens Chrome using your existing profile and extracts the underlying data structure of a Google Form:

- **Extracts entry IDs** — gets the `entry.123456` IDs needed for prefilling or submitting forms programmatically
- **Identifies question types** — detects Short answer, Multiple choice, Checkboxes, Grid, etc.
- **Gets options and scales** — retrieves available choices for dropdowns/multiple choice and min/max labels for linear scales
- **Checks required status** — determines if a field is mandatory

The extraction saves a JSON file to the `output/` folder so you always have a complete map of the form's fields.

## Requirements

- Windows
- Node.js 18 or newer
- Google Chrome installed locally
- A Google account (if the form is restricted)

The script uses `puppeteer-core`, so it relies on your installed Chrome instead of downloading a separate browser.

## Install

```bash
npm install
```

## Run

```bash
node script.js
```

The script will open Chrome, detect your profile automatically, and navigate to the default or provided Google Form URL.

The first run may open Chrome and prompt you to sign in to Google if the form requires login. If that happens, ```sign in and press Enter in the terminal``` and the session will be saved for all future runs. If you have multiple Google accounts, make sure to sign in to the one that has access to the form.

## Arguments

```bash
node script.js [formUrl] [waitSeconds]
```

| Argument | Description | Default |
|---|---|---|
| `formUrl` | The Google Form prefill URL | `https://docs.google.com/forms/d/your-form-id/prefill` |
| `waitSeconds` | Max seconds to wait for form data to load after sign-in | `10` |

Examples:

```bash
# Use default URL and wait time
node script.js

# Pass a specific Google Form prefill URL
node script.js https://docs.google.com/forms/d/your-form-id/prefill

# Pass URL and increase wait time to 30 seconds
node script.js https://docs.google.com/forms/d/your-form-id/prefill 30
```

## Output

The script writes the extracted form data to a JSON file inside `output/`:

| Action | Log file |
|---|---|
| Extract form fields | `output/form-fields.json` |

Each run will overwrite the existing `form-fields.json` file with the latest extracted data.

## Reset Chrome automation profile

If Chrome gets stuck on an old session or you want to start fresh, run:

```bash
remove.bat
```

That removes the local `.chrome-automation` profile folder used by the script.

## Notes

- The script targets the internal `FB_PUBLIC_LOAD_DATA_` object to accurately map form fields.
- It supports various question types including Short answer, Paragraph, Multiple choice, Dropdown, Checkboxes, Linear scale, Grid, Date, Time, and File upload.
- If Chrome is installed in a non-standard location, update the Chrome path candidates at the top of `script.js`.
- Extraction speed depends on the form loading time. The script waits for the form data to become available before processing.