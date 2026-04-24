# Google Form Prefill Extractor
Extracts Google Form field metadata from a prefill form and writes it to a JSON file: `output/form-fields.json`.

## What it does

The script opens Chrome, loads the Google Form prefill page, reads the form structure from the page runtime data, and saves the extracted fields as JSON.

## Requirements

- Windows
- Node.js 18 or newer
- Google Chrome installed locally
- Internet access to load the Google Form

The script uses `puppeteer-core`, so it relies on your installed Chrome instead of downloading a browser.

## Install

```bash
npm install
```

## Run

```bash
node script.js
```

The first run may open Chrome and prompt you to sign in to Google. If that happens, ```sign in and press Enter in the terminal``` when the form is visible.

You can also pass a custom form URL and an optional wait timeout in seconds:

```bash
node script.js "https://docs.google.com/forms/d/your-form-id/prefill" 15
```

If you omit the arguments, the script uses the built-in form URL and waits 10 seconds after reload for the form data to appear.

## Output

The extracted data is written to:

```bash
output/form-fields.json
```

Each entry includes the field label, entry name, type, description, and any available options or scale values.

## Reset Chrome automation profile

If Chrome gets stuck on an old session or you want to start fresh, run:

```bash
remove.bat
```

That removes the local `.chrome-automation` profile folder used by the script.

## Notes

- The script accepts the form URL as the first command-line argument.
- The second command-line argument sets the wait timeout in seconds.
- Re-running the script overwrites `output/form-fields.json`.
- If Chrome is installed in a non-standard location, update the Chrome lookup logic in `script.js`.
