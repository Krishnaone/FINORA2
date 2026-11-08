# Finora — Step 2 service pages

## Files
- `health-insurance.html` — health insurance overview and demonstration enquiry form
- `loans.html` — loan categories and demonstration enquiry form
- `term-insurance.html` — term insurance overview and demonstration enquiry form
- `service.css` — shared styles for all three service pages
- `service.js` — shared demonstration-only form behaviour

## Add to your existing project
Copy the three HTML files, `service.css`, and `service.js` into the same folder as your existing `index.html`, `style.css`, and `script.js`.

The service pages link to the existing `style.css` so they reuse the homepage brand styling.

## Update homepage service links
In `index.html`, change the three service-card links:
- Health Insurance: `href="health-insurance.html"`
- Loans: `href="loans.html"`
- Term Insurance: `href="term-insurance.html"`

You can also change the homepage navigation's “Our Services” links later if you add a dedicated services page.

## Run locally
Open the project folder in VS Code. Use Live Server on `index.html`, then click each service card. You can also open each HTML page directly with Live Server.

## Important: demo mode
These forms validate required fields in the browser but deliberately do not read, transmit, email, or store the entered information. Do not use them to collect real customer data. Backend integration, consent language, access controls, privacy notices and applicable authorisations must be addressed before real submissions are enabled.
