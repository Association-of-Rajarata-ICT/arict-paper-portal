# SEO and sharing setup

Production hostname: https://papers.arict.lk  
Site name: ARICT Past Paper Portal

## What changed and why

| Change | Purpose |
| --- | --- |
| Shared Home, Past Papers, Faculty, About ARICT, Help and Contact links in the header and footer | Gives visitors and crawlers a consistent route to the main public pages. Next.js Link renders real anchors in server HTML. |
| Unique titles and 120–155 character descriptions for all eight public pages | Describes each page clearly. Paper pages also include the subject and examination period in their metadata. |
| One H1 per public page; the home H1 uses the full site name | Makes the page topic and brand explicit. |
| Server-rendered home data, search results and paper details | Paper content and links are available in the initial response, before browser JavaScript runs. Client components retain search, filtering and sharing interactions. |
| Removed sample-paper fallbacks from public search and detail pages | Database failures no longer display unrelated demonstration records. Invalid or deleted papers return not-found responses; database errors are not treated as missing records. |
| Canonical HTTPS URLs, clean paper links, and redirects from old department-prefixed paper IDs | Consolidates duplicate URL variants. Query-string searches canonicalize to /search and carry noindex,follow. The main /search page remains indexable. |
| WebSite and Organization JSON-LD on the homepage | Supplies the full site name, publisher, logo and existing ARICT social profiles. JSON-LD escapes HTML delimiters safely. |
| Full Open Graph and Twitter metadata | Provides the correct page title, description, site name, URL and sharing image. |
| Dynamic sitemap and robots metadata routes | /sitemap.xml lists all main pages and live paper records; /robots.txt allows public crawling and points to it. Paper lastmod values come from database timestamps. |
| Noindex metadata and HTTP headers for administration; noindex HTTP headers for APIs | Keeps management screens and data endpoints out of search results. Existing admin authentication is preserved. |
| Faculty page lists real departments and links to their papers | Replaces generic support-team claims with useful navigation. About-page claims about universal verification and industry partners were also removed. |

Google chooses sitelinks automatically; these changes improve structure but cannot force sitelinks or a particular search appearance. See [Google's sitelinks guidance](https://developers.google.com/search/docs/appearance/sitelinks) and [site-name guidance](https://developers.google.com/search/docs/appearance/site-names).

Descriptions follow the requested character range, but Google may select a different snippet from page content. This range is an editorial constraint, not a guarantee of display length.

## Assets already created

No additional image files are required for this change.

| Repository file | Public URL | Dimensions |
| --- | --- | --- |
| public/og-image.png | /og-image.png | 1200 × 630 |
| public/favicon-48x48.png | /favicon-48x48.png | 48 × 48 |
| public/favicon-192x192.png | /favicon-192x192.png | 192 × 192 |
| public/apple-touch-icon.png | /apple-touch-icon.png | 180 × 180 |
| src/app/favicon.ico | /favicon.ico | ICO containing 16, 32 and 48 px images |
| public/logo.png | /logo.png | Existing organization logo |

The icons adapt the existing ARICT wordmark into a square without changing its letter shapes. Regenerate them with `node scripts/generate-icons.mjs`. Root-layout metadata adds the icon links to every page. Keep these URLs stable and crawlable; see [Google's favicon guidance](https://developers.google.com/search/docs/appearance/favicon-in-search).

The sharing image was created with the built-in imagegen tool, then resized to 1200 × 630 and saved inside this repository. Exact generation prompt:

> Use case: ads-marketing.
> Asset type: Open Graph social sharing image for https://papers.arict.lk, a student-run past examination paper archive for the Faculty of Applied Sciences at Rajarata University of Sri Lanka.
> Create a polished, restrained academic editorial cover, landscape 1200x630 composition (1.905:1). Brand colors: deep maroon #790000, warm off-white #f4f4f1, charcoal #171719. Use bold clear sans serif typography with very high contrast and ample whitespace. On the left, prominent exact title on two lines: "ARICT" then "Past Paper Portal". Below in smaller but legible type: "Faculty of Applied Sciences" then "Rajarata University of Sri Lanka". Bottom left: "papers.arict.lk". On the right: a refined dimensional illustration of neatly stacked examination sheets, a maroon page tab and a simple magnifying glass, with subtle paper shadows and faint grid detail; no readable text on the illustrated sheets. Keep all text within a 70px safe margin, make the title dominant and readable in a small social preview. No claims, badges, gradients, invented seals, university crests, watermarks, people, or additional text. Opaque warm off-white background. The finished image should feel like a professional university archive, not an advertisement for tutoring.

## Maintaining metadata

- `src/lib/seo.js` defines the production hostname, main navigation, public-page descriptions, image metadata and paper metadata helper.
- Each public server page calls `pageMetadata()`. Paper pages use `generateMetadata()` with their database record.
- `src/app/sitemap.js` and `src/app/robots.js` are Next.js metadata routes; do not add conflicting static files under public/.
- Organization social links come from `src/lib/constants.js`: Facebook, LinkedIn, GitHub and Instagram.
- Keep the public hostname consistent with redirects in the hosting dashboard. Redirect old deployment domains to the matching path on papers.arict.lk when appropriate.

## Internal links

Already added:

- Home → “Browse past examination papers”, “Faculty of Applied Sciences departments”, and “guide to finding and downloading papers”.
- Home/About → “contact ARICT to contribute a past paper” or contributions/corrections.
- Faculty → “Browse [department] past papers” for each of the five departments.
- Paper pages → breadcrumb links, related papers, and “All [department] papers”.

Future improvements: link a relevant subject or department name in faculty study guides to its resources. If department pages become important search destinations, create stable department landing pages with useful original text instead of relying only on filtered search URLs. Search filters are interactive, and pagination still uses client controls; the sitemap provides direct discovery of every database-backed paper URL.

## Before deployment and indexing

1. Deploy this checkout to the existing host serving **papers.arict.lk**. These local changes do not publish themselves.
2. Confirm the production DATABASE_URL and existing service settings remain configured. A working database is required for paper details, initial search results and paper URLs in the sitemap. During an archive outage the sitemap serves main pages only and logs the failure.
3. Confirm the public homepage, main pages, sitemap, robots file, favicon and sharing image return successful HTTPS responses without a login, deployment password, bot challenge or unintended X-Robots-Tag: noindex header. Admin pages should stay private and noindex.
4. Confirm PDFs remain publicly viewable through their Drive links. The portal exposes metadata around embedded PDFs; it does not render PDF text into page HTML.
5. Redirect HTTP and alternate hosts consistently to the canonical HTTPS hostname, and retain existing paths.

## Google Search Console checklist

1. Add a **Domain property for arict.lk**, which covers papers.arict.lk, and verify using the DNS TXT record Google provides. Alternatively, verify a URL-prefix property for **https://papers.arict.lk/**. For the HTML-tag method, set `GOOGLE_SITE_VERIFICATION` on the deployment to the token from the tag's content attribute and redeploy; the root layout emits the verification tag. Do not paste the whole HTML tag into the variable. [Ownership verification](https://support.google.com/webmasters/answer/9008080).
2. In **Sitemaps**, submit **https://papers.arict.lk/sitemap.xml** and check that Google can fetch it. [Sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
3. Use **URL Inspection → Test live URL** for the homepage, /search, /about, /faculty and one real paper. Check the rendered HTML, crawl permission and selected canonical, then choose **Request indexing** for the homepage and important changed URLs. [Recrawl guidance](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).
4. Monitor **Page indexing**, **Sitemaps**, **Core Web Vitals** and search performance. Investigate unexpected 5xx responses, blocked resources, duplicate canonicals and excluded main pages. Search query URLs and admin URLs are intentionally excluded.

## Validation

Run `npm run build`, then `npm start`, and in another terminal:

```sh
node scripts/check-seo.mjs http://localhost:3000
```

The checker examines raw HTTP responses, without executing browser JavaScript: titles, description lengths, canonical URLs, Open Graph tags, H1 count, header/footer anchors, homepage JSON-LD, favicon/image dimensions, sitemap, robots, query noindex and missing-paper status. When the database supplies records, it also checks a real server-rendered paper and a legacy-ID redirect.

A production build needs network access to Google Fonts because this project already uses next/font/google. This checkout has no DATABASE_URL configured, so local live-paper/database verification is limited; rerun the same check against the deployed site after configuring it.

Verification completed on 31 October 2026: production build passed, and the HTTP checker passed for all eight public pages plus sitemap, robots, icons, sharing image, admin noindex and missing-paper handling. The generated image and favicon were inspected. A full browser layout check could not be completed: the browser access host was unavailable and native browser capture reported a minimized window.
