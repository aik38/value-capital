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
Privacy and terms remain noindex and excluded from the sitemap.
`scripts/publication.mjs` explicitly lists reviewed public pages, their index policy,
legacy redirects and individual assets. Build and verification share that list;
sitemap URLs must exactly match its indexable pages, without a fixed URL count.
For a future approved page, add its manifest entry and canonical sitemap URL together.
No draft URL or directory is auto-discovered. The build cleans dist and copies only
listed regular files; verification rejects extra files, including stale output.
Keep private sources/data outside this list. Future content must provide public HTML,
unique metadata, canonical/OGP URLs and valid JSON-LD before deployment.
No sitemap lastmod is asserted because a build timestamp is not a content-change timestamp.

## M&A news publication (initial integration, awaiting approval)

`scripts/news-publication.json` explicitly lists the news index, individual article
paths and the single news stylesheet. `scripts/news-manifest.mjs` validates their
scope, regular-file status and SHA-256 digests before adding them to the existing
publication allowlist. It never scans directories for additional HTML. Drafts,
Private JSON, extraction evidence, usage logs and credentials are not public assets.
An empty news index remains noindex and outside sitemap until approved articles exist.
For approved articles, the manifest and sitemap are updated in the same Public commit.
The existing build, checks, GAS retrieval and Pages schedule are retained unchanged.
NewsArticle checks supplement every existing metadata/allowlist check. News pages
link to the existing LP, valuation, buyer and deals pages; existing page bodies,
CSS/JS, form/GAS behavior and navigation are unchanged.

Organization and WebSite have stable IDs; WebPage/AboutPage reference them.
ItemList contains only the actual displayed cards, and is updated after filtering.
No invisible FAQ, invented reviews, licenses, phone numbers or social profiles are added.

Before this change, main was `b2595f84d7f55750dc7533ce2b7e964894d50fb6`.
The backup branch is `backup/pre-technical-seo-aio-20261007`.
To roll back the deployment model, restore the desired source commit and switch
Pages Source back to Deploy from a branch, main, root. Confirm the resulting
deployment and live URLs. The custom domain and Enforce HTTPS stay as configured.
