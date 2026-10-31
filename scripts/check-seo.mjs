import assert from "node:assert/strict";
import { PUBLIC_PAGES, MAIN_NAV_LINKS, SITE_NAME, SITE_URL, paperMetadata, serializeJsonLd } from "../src/lib/seo.js";

const base = process.argv[2] || "http://localhost:3000";
const decode = (value = "") => value.replaceAll("&amp;", "&").replaceAll("&#x27;", "'").replaceAll("&quot;", '"').replaceAll("&lt;", "<").replaceAll("&gt;", ">");
const attributes = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1], decode(match[2])]));
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "g"))].map(([tag]) => attributes(tag));
async function get(path, options = {}) {
  return fetch(new URL(path, base), {
    headers: { "User-Agent": "facebookexternalhit/1.1" },
    signal: AbortSignal.timeout(30000),
    ...options,
  });
}

const descriptions = new Set();
for (const [path, page] of Object.entries(PUBLIC_PAGES)) {
  const response = await get(path);
  assert.equal(response.status, 200, `${path}: HTTP status`);
  const html = await response.text();
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] || "";
  const body = html.replace(/<script\b[\s\S]*?<\/script>/g, "");
  const meta = tags(head, "meta");
  const links = tags(head, "link");
  const description = meta.find((tag) => tag.name === "description")?.content;
  assert.equal(decode(head.match(/<title>(.*?)<\/title>/)?.[1]), `${page.title} | ${SITE_NAME}`, `${path}: title`);
  assert.equal(description, page.description, `${path}: description`);
  assert.ok(description.length >= 120 && description.length <= 155, `${path}: description length`);
  assert.ok(!descriptions.has(description), `${path}: unique description`);
  descriptions.add(description);
  assert.equal((body.match(/<h1\b/g) || []).length, 1, `${path}: one rendered H1`);
  assert.equal(new URL(links.find((tag) => tag.rel === "canonical")?.href).href, new URL(path, SITE_URL).href, `${path}: canonical`);
  for (const property of ["og:site_name", "og:title", "og:description", "og:url", "og:image"]) {
    assert.ok(meta.some((tag) => tag.property === property && tag.content), `${path}: ${property}`);
  }
  assert.equal(meta.find((tag) => tag.property === "og:site_name")?.content, SITE_NAME);
  assert.equal(new URL(meta.find((tag) => tag.property === "og:url")?.content).href, new URL(path, SITE_URL).href);
  assert.equal(meta.find((tag) => tag.property === "og:image")?.content, `${SITE_URL}/og-image.png`);
  assert.ok(!meta.some((tag) => tag.name === "robots" && tag.content.includes("noindex")), `${path}: indexable`);
  assert.ok(links.some((tag) => tag.rel === "icon" && tag.sizes === "48x48"), `${path}: square favicon`);
  assert.ok(links.some((tag) => tag.rel === "apple-touch-icon" && tag.sizes === "180x180"), `${path}: apple icon`);
  for (const id of ["desktop-nav", "main-footer"]) {
    const element = body.match(new RegExp(`<(${id === "desktop-nav" ? "nav" : "footer"})\\b[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/\\1>`))?.[2];
    assert.ok(element, `${path}: ${id}`);
    const anchors = tags(element, "a");
    for (const link of MAIN_NAV_LINKS) assert.ok(anchors.some((tag) => tag.href === link.href), `${path}: ${id} link to ${link.href}`);
  }
  if (path === "/") {
    const json = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]);
    const website = json["@graph"].find((item) => item["@type"] === "WebSite");
    const organization = json["@graph"].find((item) => item["@type"] === "Organization");
    assert.equal(website.name, SITE_NAME);
    assert.equal(website.url, `${SITE_URL}/`);
    assert.ok(organization.logo.startsWith(SITE_URL));
    assert.ok(organization.sameAs.includes("https://www.facebook.com/arict.rjt"));
    assert.ok(organization.sameAs.includes("https://www.linkedin.com/company/arict/"));
  }
  console.log(`PASS ${path}: metadata, H1, crawlable navigation, icons`);
}

const filtered = await (await get("/search?q=Computing")).text();
assert.ok(tags(filtered, "meta").some((tag) => tag.name === "robots" && tag.content.includes("noindex")));
assert.equal(tags(filtered, "link").find((tag) => tag.rel === "canonical")?.href, `${SITE_URL}/search`);
const missing = await get("/paper/not-a-real-paper");
assert.equal(missing.status, 404, "Missing paper must return HTTP 404");
assert.ok((await missing.text()).includes("noindex"));
const admin = await get("/admin/login");
assert.ok(admin.headers.get("x-robots-tag")?.includes("noindex"));
assert.ok((await admin.text()).includes('content="noindex'));

const robots = await (await get("/robots.txt")).text();
assert.ok(robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`));
assert.ok(robots.includes("Allow: /"));
const sitemapResponse = await get("/sitemap.xml");
assert.equal(sitemapResponse.status, 200);
const sitemap = await sitemapResponse.text();
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => decode(match[1]));
for (const path of Object.keys(PUBLIC_PAGES)) assert.ok(urls.includes(new URL(path, SITE_URL).href));
assert.ok(!urls.some((url) => url.includes("/admin") || url.includes("?")));

for (const [path, width, height] of [
  ["/favicon-48x48.png", 48, 48],
  ["/favicon-192x192.png", 192, 192],
  ["/apple-touch-icon.png", 180, 180],
  ["/og-image.png", 1200, 630],
]) {
  const response = await get(path);
  assert.equal(response.status, 200);
  assert.ok(response.headers.get("content-type")?.includes("image/png"));
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.readUInt32BE(16), width);
  assert.equal(bytes.readUInt32BE(20), height);
}
assert.equal((await get("/favicon.ico")).status, 200);
assert.ok(!serializeJsonLd({ name: "</script><script>alert(1)</script>" }).includes("<"));
for (const length of [1, 10, 30, 100]) {
  const metadata = paperMetadata({ id: "test", courseCode: "C".repeat(length), title: "Subject ".repeat(length), examPeriod: "March | May 2026" });
  assert.ok(metadata.description.length >= 120 && metadata.description.length <= 155);
}

const paperUrl = urls.find((url) => new URL(url).pathname.startsWith("/paper/"));
if (paperUrl) {
  const path = new URL(paperUrl).pathname;
  const response = await get(path);
  assert.equal(response.status, 200);
  const html = await response.text();
  const body = html.replace(/<script\b[\s\S]*?<\/script>/g, "");
  assert.equal((body.match(/<h1\b/g) || []).length, 1);
  assert.ok(!body.includes("skeleton"), "Paper content must be server-rendered");
  assert.equal(tags(html, "link").find((tag) => tag.rel === "canonical")?.href, paperUrl);
  const legacy = await get(`/paper/Computing-${path.split("/").pop()}`, { redirect: "manual" });
  assert.equal(legacy.status, 308);
  console.log("PASS live paper: server-rendered details, canonical, legacy redirect");
} else {
  console.log("LIMIT: No paper records in sitemap. Live-paper rendering needs a configured database with records.");
}
console.log(`PASS sitemap (${urls.length} URLs), robots, query canonical, 404, admin noindex, image dimensions, JSON-LD escaping`);
