import { readFile, writeFile } from "node:fs/promises";

const API = "https://api.tcgplayer.com";
const VERSION = "v1.39.0";
const publicKey = process.env.TCGPLAYER_PUBLIC_KEY;
const privateKey = process.env.TCGPLAYER_PRIVATE_KEY;

if (!publicKey || !privateKey) throw new Error("Missing TCGPLAYER_PUBLIC_KEY or TCGPLAYER_PRIVATE_KEY.");

const collections = JSON.parse(await readFile("data/collections.json", "utf8"));
if (!Array.isArray(collections) || !collections.length) throw new Error("data/collections.json is empty. Add the approved category/group IDs first.");

async function api(path, options = {}) {
  const response = await fetch(`${API}/${VERSION}${path}`, options);
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { text }; }
  if (!response.ok || body.success === false) throw new Error(`${response.status} ${path}: ${JSON.stringify(body.errors || body)}`);
  return body;
}

const tokenResponse = await fetch(`${API}/token`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ grant_type: "client_credentials", client_id: publicKey, client_secret: privateKey })
});
if (!tokenResponse.ok) throw new Error(`Token request failed: ${tokenResponse.status}`);
const token = (await tokenResponse.json()).access_token;
const auth = { Authorization: `bearer ${token}`, Accept: "application/json" };

const cards = [];
for (const collection of collections) {
  const products = await api(`/catalog/products?groupId=${encodeURIComponent(collection.groupId)}&limit=100`, { headers: auth });
  const catalog = (products.results || []).filter((product) => product.name && product.productId);
  const ids = catalog.map((product) => product.productId);
  if (!ids.length) continue;
  const pricing = await api(`/pricing/product/${ids.join(",")}`, { headers: auth });
  const prices = new Map((pricing.results || []).map((item) => [String(item.productId), item]));
  for (const product of catalog) {
    const price = prices.get(String(product.productId));
    if (!price?.marketPrice) continue;
    cards.push({
      name: product.name,
      set: collection.name,
      game: collection.game,
      year: Number(collection.year),
      marketPrice: Number(price.marketPrice),
      change30d: 0,
      url: product.url?.startsWith("http") ? product.url : "https://www.tcgplayer.com/",
      imageUrl: product.imageUrl || ""
    });
  }
}

cards.sort((a, b) => b.marketPrice - a.marketPrice);
await writeFile("data/cards.json", `${JSON.stringify({ updatedAt: new Date().toISOString(), source: "tcgplayer", cards }, null, 2)}\n`);
console.log(`Wrote ${cards.length} cards to data/cards.json`);

