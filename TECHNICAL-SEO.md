# Technical SEO deployment

The visible LP, CSS, images, form fields, GAS form backend and GA4 ID remain unchanged.

GitHub Pages publishes the `dist` artifact built by `.github/workflows/pages.yml`.
Pages Settings > Build and deployment > Source must be **GitHub Actions**.
The workflow runs on main pushes, manual dispatch and twice hourly (UTC minutes 17 and 47).
Scheduled runs can be delayed by GitHub; they are not an immediate publication guarantee.

`node scripts/build.mjs` retrieves only the existing public GAS `action=deals`
endpoint, validates the response, and renders the same card function used by the
browser. Only the fields already displayed by those cards enter the HTML.
No raw API payload, unused feature/profit/scheme fields, seed fixtures, GAS source,
build scripts or private spreadsheet content enters the published artifact.
`node scripts/check.mjs` checks URLs, references, index policies and JSON-LD before deployment.

The browser still fetches current public data and handles the existing filters.
An unavailable API preserves the last static snapshot; it does not overwrite it
with an empty error state. An API/build failure aborts deployment and preserves
the previous Pages release. Successfully fetched empty public data removes all cards.
Consequently, newly unpublished data can remain in static HTML until the next
successful scheduled or manual deployment. Use Actions > Build and deploy public
site > Run workflow after an urgent publication/unpublication, and check its result.

Canonical URLs use HTTPS, no www, and trailing slashes. GitHub Pages itself handles
HTTP/www/directory redirects. Old `.html` compatibility files remain instant
meta-refresh redirects with canonical URLs and `noindex,follow`; Pages does not
provide per-path server redirect rules. Do not change DNS for these redirects.
Privacy and terms remain noindex and excluded from the five-URL sitemap.
No sitemap lastmod is asserted because a build timestamp is not a content-change timestamp.

Organization and WebSite have stable IDs; WebPage/AboutPage reference them.
ItemList contains only the actual displayed cards, and is updated after filtering.
No invisible FAQ, invented reviews, licenses, phone numbers or social profiles are added.

Before this change, main was `b2595f84d7f55750dc7533ce2b7e964894d50fb6`.
The backup branch is `backup/pre-technical-seo-aio-20261007`.
To roll back the deployment model, restore the desired source commit and switch
Pages Source back to Deploy from a branch, main, root. Confirm the resulting
deployment and live URLs. The custom domain and Enforce HTTPS stay as configured.
