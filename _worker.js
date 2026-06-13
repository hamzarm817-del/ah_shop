const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function groqChat(messages, apiKey, responseFormat) {
  const body = { model: 'llama-3.3-70b-versatile', messages, temperature: 0.7, max_tokens: 2048 };
  if (responseFormat) body.response_format = responseFormat;
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Groq API error ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}

function corsPreflight() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}

function getFallbackReviews(title, tone, lang) {
  const shortTitle = title ? title.slice(0, 30) : "Product";
  if (lang === 'ur') return [
    { id: "ai-f1", name: "عامر نعیم", rating: 5, text: `کمال کا ہے! ${shortTitle} نے دل خوش کر دیا۔`, date: "1 day ago" },
    { id: "ai-f2", name: "ردا بتول", rating: 5, text: "پیکنگ بہت کمال کی تھی اور ڈلیوری وقت پر ہوئی۔", date: "3 days ago" },
    { id: "ai-f3", name: "عثمان خان", rating: 4, text: "کوالٹی بہت اچھی ہے۔", date: "Last week" }
  ];
  if (lang === 'ar') return [
    { id: "ai-f1", name: "سلمان الحربي", rating: 5, text: `جودة ممتازة! ${shortTitle} أنصح بشراء.`, date: "منذ يوم" },
    { id: "ai-f2", name: "فاطمة الغامدي", rating: 5, text: "منتج رائع والتوصيل سريع.", date: "منذ ٣ أيام" },
    { id: "ai-f3", name: "ياسر الشمري", rating: 5, text: "يستحق ٥ نجوم.", date: "منذ أسبوع" }
  ];
  const texts = { friendly: ["Absolutely love it!", "So glad I bought this!", "Perfect addition!"], critical: ["Great build, could be better.", "Very useful!", "Fine value."], professional: ["Highly efficient.", "Beautifully engineered.", "A premium product."], funny: ["Works so smoothly!", "I was skeptical!", "10/10."] };
  const arr = texts[tone] || texts.friendly;
  return [
    { id: "ai-f1", name: "David L.", rating: 5, text: arr[0], date: "1 day ago" },
    { id: "ai-f2", name: "Sarah K.", rating: 5, text: arr[1], date: "3 days ago" },
    { id: "ai-f3", name: "Oliver P.", rating: 4, text: arr[2], date: "1 week ago" }
  ];
}

function getFallbackNicheProducts(niche) {
  const norm = (niche || '').toLowerCase();
  const gaming = norm.includes('gaming') || norm.includes('setup');
  return gaming ? [
    { id: "gen-1", Title: "RGB Mechanical Wireless Gaming Keyboard", Handle: "rgb-mechanical-wireless-gaming-keyboard", Price: 180, ComparePrice: 240, ImageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=600", Category: "Tech & Gadgets", Description: "Tactile mechanical switches with backlit keys." },
    { id: "gen-2", Title: "Ergonomic Memory Foam Lumbar Support Pillow", Handle: "ergonomic-memory-foam-lumbar-support-pillow", Price: 75, ComparePrice: 110, ImageUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=600", Category: "Tech & Gadgets", Description: "Premium contour shape for long sessions." },
    { id: "gen-3", Title: "Anti-Glare Gaming Glasses", Handle: "anti-glare-gaming-glasses", Price: 45, ComparePrice: 75, ImageUrl: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=600", Category: "Tech & Gadgets", Description: "Reduce digital strain." },
    { id: "gen-4", Title: "LED Ambient Studio Bar Set", Handle: "led-ambient-studio-bar-set", Price: 120, ComparePrice: 180, ImageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600", Category: "Tech & Gadgets", Description: "Music-sync LED lights." }
  ] : [
    { id: "gen-11", Title: "Aromatherapy Mist Diffuser", Handle: "aromatherapy-mist-diffuser", Price: 95, ComparePrice: 135, ImageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=600", Category: "Health & Beauty", Description: "Purifying mist diffuser." },
    { id: "gen-12", Title: "Smart Temperature Bottle", Handle: "smart-temperature-bottle", Price: 35, ComparePrice: 55, ImageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=600", Category: "Kitchen", Description: "LCD ring indicator." },
    { id: "gen-13", Title: "Organic Rosehip Seed Oil", Handle: "organic-rosehip-oil", Price: 60, ComparePrice: 90, ImageUrl: "https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&q=80&w=600", Category: "Health & Beauty", Description: "Premium skincare oil." },
    { id: "gen-14", Title: "USB Garlic Ginger Masher", Handle: "usb-garlic-masher", Price: 28, ComparePrice: 48, ImageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600", Category: "Kitchen", Description: "Electric single-touch blender." }
  ];
}

async function handleGenerateReviews(body, apiKey) {
  try {
    const { title, category, description, tone, language } = body;
    const content = await groqChat([
      { role: 'system', content: `Write 3 reviews for "${title}". Language: ${language || 'en'}, Tone: ${tone || 'friendly'}. Return {"reviews":[{"id":"r1","name":"","rating":4|5,"text":"","date":""}]}` },
      { role: 'user', content: `Generate for: ${title}, ${category || ''}` }
    ], apiKey, { type: 'json_object' });
    if (content) return json({ reviews: JSON.parse(content).reviews, source: 'groq-ai' });
    throw new Error("Empty");
  } catch (error) {
    return json({ reviews: getFallbackReviews(body.title, body.tone, body.language), source: 'offline-fallback', error: error.message });
  }
}

async function handleImportGenerator(body, apiKey) {
  try {
    const { niche, language } = body;
    const content = await groqChat([
      { role: 'system', content: 'Generate 4 products. Return {"products":[{"id":"","Title":"","Handle":"","Price":0,"ComparePrice":0,"ImageUrl":"","Category":"","Description":""}]}' },
      { role: 'user', content: `Niche: "${niche || 'Trendy Gadgets'}" Language: "${language || 'en'}"` }
    ], apiKey, { type: 'json_object' });
    if (content) return json({ products: JSON.parse(content).products, source: 'groq-ai' });
    throw new Error("Empty");
  } catch (err) {
    return json({ products: getFallbackNicheProducts(body.niche), source: 'offline-fallback' });
  }
}

async function handleMarketingSlogans(body, apiKey) {
  try {
    const { title, category, tone } = body;
    const content = await groqChat([
      { role: 'system', content: 'You are an advertising copywriter.' },
      { role: 'user', content: `Generate 5 slogans for "${title}". Tone: ${tone || 'professional'}. Return {"slogans":[{"id":"s1","text":"","style":""}]}` }
    ], apiKey, { type: 'json_object' });
    if (content) return json({ slogans: JSON.parse(content).slogans, source: 'groq-ai' });
    throw new Error("Empty");
  } catch (error) {
    const t = body.title || 'Product';
    return json({ slogans: [
      { id: "s1", text: `Premium ${t} — Elevate Your Life`, style: "Elegant" },
      { id: "s2", text: `Shop Smart. Live Better. ${t}`, style: "Modern" },
      { id: "s3", text: `Unbox Excellence — ${t}`, style: "Bold" },
    ], source: 'offline-fallback', error: error.message });
  }
}

async function handleDescriptionGenerator(body, apiKey) {
  try {
    const { title, category, features, tone } = body;
    const content = await groqChat([
      { role: 'system', content: 'You are an e-commerce copywriter.' },
      { role: 'user', content: `Write description for "${title}". Return {"descriptions":[{"id":"d1","text":"","style":""}]}` }
    ], apiKey, { type: 'json_object' });
    if (content) return json({ descriptions: JSON.parse(content).descriptions, source: 'groq-ai' });
    throw new Error("Empty");
  } catch (error) {
    return json({ descriptions: [
      { id: "d1", text: `Experience premium quality with ${body.title || 'Product'}.`, style: "Professional" },
      { id: "d2", text: `Meet ${body.title || 'Product'} — style and functionality.`, style: "Casual" }
    ], source: 'offline-fallback', error: error.message });
  }
}

async function handleSeoTags(body, apiKey) {
  try {
    const { title, category, description } = body;
    const content = await groqChat([
      { role: 'system', content: 'You are an SEO expert.' },
      { role: 'user', content: `Generate SEO tags for "${title}". Return {"seo":{"metaTitle":"","metaDescription":"","keywords":[],"ogTitle":"","ogDescription":""}}` }
    ], apiKey, { type: 'json_object' });
    if (content) return json({ seo: JSON.parse(content).seo, source: 'groq-ai' });
    throw new Error("Empty");
  } catch (error) {
    const t = body.title || 'Product';
    return json({ seo: { metaTitle: `Buy ${t} Online | Best Prices in Saudi Arabia`, metaDescription: `Shop ${t} at the best price. Fast delivery.`, keywords: [t, body.category || 'ecommerce', 'buy online'], ogTitle: `${t} - Premium Quality`, ogDescription: `Discover ${t} at AH Shop.` }, source: 'offline-fallback', error: error.message });
  }
}

async function handleThemeSuggestions(body, apiKey) {
  try {
    const { storeName, industry } = body;
    const content = await groqChat([
      { role: 'system', content: 'You are a UI/UX design expert.' },
      { role: 'user', content: `Suggest 3 themes for "${storeName}". Return {"themes":[{"themeName":"","primaryColor":"","secondaryColor":"","fontStyle":"","borderRadius":""}]}` }
    ], apiKey, { type: 'json_object' });
    if (content) return json({ themes: JSON.parse(content).themes, source: 'groq-ai' });
    throw new Error("Empty");
  } catch (error) {
    return json({ themes: [
      { themeName: "Modern Indigo", primaryColor: "#4F46E5", secondaryColor: "#F8FAFC", fontStyle: "space-grotesk", borderRadius: "medium" },
      { themeName: "Desert Rose", primaryColor: "#E11D48", secondaryColor: "#FFF7ED", fontStyle: "playfair-serif", borderRadius: "large" },
      { themeName: "Ocean Breeze", primaryColor: "#0891B2", secondaryColor: "#F0FDFA", fontStyle: "system-sans", borderRadius: "small" }
    ], source: 'offline-fallback', error: error.message });
  }
}

async function handlePriceOptimizer(body, apiKey) {
  try {
    const { title, costPrice, competitorPrice } = body;
    const content = await groqChat([
      { role: 'system', content: 'You are a pricing strategy expert.' },
      { role: 'user', content: `Analyze pricing for "${title}". Cost: ${costPrice || '50'}, Competitor: ${competitorPrice || '150'}. Return {"pricing":{"suggestedPrice":0,"minPrice":0,"maxPrice":0,"comparePrice":0,"margin":"","strategy":""}}` }
    ], apiKey, { type: 'json_object' });
    if (content) return json({ pricing: JSON.parse(content).pricing, source: 'groq-ai' });
    throw new Error("Empty");
  } catch (error) {
    return json({ pricing: { suggestedPrice: 129, minPrice: 99, maxPrice: 199, comparePrice: 179, margin: "~40%", strategy: "Competitive" }, source: 'offline-fallback', error: error.message });
  }
}

async function handleCategoryDetection(body, apiKey) {
  try {
    const { title, description } = body;
    const content = await groqChat([
      { role: 'system', content: 'You are a categorization expert.' },
      { role: 'user', content: `Detect category for "${title}". Return {"categories":[{"name":"","confidence":0,"reason":""}]}` }
    ], apiKey, { type: 'json_object' });
    if (content) return json({ categories: JSON.parse(content).categories, source: 'groq-ai' });
    throw new Error("Empty");
  } catch (error) {
    return json({ categories: [{ name: "Tech & Gadgets", confidence: 70, reason: "Based on naming" }], source: 'offline-fallback', error: error.message });
  }
}

async function handleChatbot(body, apiKey) {
  try {
    const { message, history } = body;
    const messages = [{ role: 'system', content: 'You are a helpful e-commerce assistant for AH Shop. Be concise and friendly. Answer questions about products, orders, shipping, returns, and store policies.' }];
    if (Array.isArray(history)) history.slice(-6).forEach(m => messages.push({ role: m.role || 'user', content: m.content || '' }));
    messages.push({ role: 'user', content: message });
    const content = await groqChat(messages, apiKey);
    if (content) return json({ reply: content.trim(), source: 'groq-ai' });
    throw new Error("Empty");
  } catch (error) {
    return json({ reply: "I'm having trouble connecting. Please try again.", source: 'offline-fallback', error: error.message });
  }
}

async function handleBlogGenerator(body, apiKey) {
  try {
    const { topic, category, keywords, count } = body;
    const content = await groqChat([
      { role: 'system', content: 'You are an SEO content strategist.' },
      { role: 'user', content: `Write ${count || 1} SEO blog post(s) about "${topic}". Return {"posts":[{"id":"","title":"","slug":"","excerpt":"","content":"","metaTitle":"","metaDescription":"","tags":[],"readingTime":""}]}` }
    ], apiKey, { type: 'json_object' });
    if (content) return json({ posts: JSON.parse(content).posts, source: 'groq-ai' });
    throw new Error("Empty");
  } catch (error) {
    return json({ posts: [{ id: "blog-1", title: `Ultimate Guide to ${body.topic || 'Smart Shopping'} 2026`, slug: `guide-${(body.topic || 'shopping').toLowerCase().replace(/\s+/g, '-')}`, excerpt: `Your guide to ${body.topic || 'smart shopping'}.`, content: `<p>Welcome to our guide on ${body.topic || 'smart shopping'}.</p><p>At AH Shop, we curate the finest products.</p>`, metaTitle: `${body.topic || 'Shopping'} Guide | AH Shop`, metaDescription: `Expert guide to ${body.topic || 'shopping'} from AH Shop.`, tags: [body.topic || 'shopping', 'guide', 'AH Shop'], readingTime: "3 min" }], source: 'offline-fallback', error: error.message });
  }
}

async function handleSeoAnalyzer(body, apiKey) {
  try {
    const { pageTitle, pageContent } = body;
    const content = await groqChat([
      { role: 'system', content: 'You are an SEO auditor.' },
      { role: 'user', content: `Analyze SEO for "${pageTitle}". Return {"analysis":{"score":0,"issues":[],"recommendations":[],"keywords":[],"metaSuggestions":{},"schemaSuggestions":[]}}` }
    ], apiKey, { type: 'json_object' });
    if (content) return json({ analysis: JSON.parse(content).analysis, source: 'groq-ai' });
    throw new Error("Empty");
  } catch (error) {
    return json({ analysis: { score: 72, issues: ["Optimize images"], recommendations: ["Compress images", "Add alt text"], keywords: ["online store"], metaSuggestions: {}, schemaSuggestions: [] }, source: 'offline-fallback' });
  }
}

async function handleAltText(body, apiKey) {
  try {
    const { productName, category } = body;
    const content = await groqChat([
      { role: 'system', content: 'You are an SEO and accessibility expert.' },
      { role: 'user', content: `Generate 3 alt text for "${productName}". Return {"altTexts":[{"id":"a1","text":"","focus":""}]}` }
    ], apiKey, { type: 'json_object' });
    if (content) return json({ altTexts: JSON.parse(content).altTexts, source: 'groq-ai' });
    throw new Error("Empty");
  } catch (error) {
    return json({ altTexts: [
      { id: "a1", text: `${body.productName || 'Product'} at AH Shop`, focus: "Brand" },
      { id: "a2", text: `Buy ${body.productName || 'Product'} online`, focus: "SEO" },
      { id: "a3", text: `${body.productName || 'Product'} - premium quality`, focus: "Quality" }
    ], source: 'offline-fallback' });
  }
}

function handleSitemapData(url) {
  try {
    const params = new URLSearchParams(url.search);
    const products = params.get('products') ? JSON.parse(decodeURIComponent(params.get('products'))) : [];
    const siteUrl = 'https://ahshop.pages.dev';
    const today = new Date().toISOString().split('T')[0];
    const urls = [
      { loc: siteUrl, lastmod: today, priority: '1.0', changefreq: 'daily' },
      { loc: `${siteUrl}/#/admin`, lastmod: today, priority: '0.3', changefreq: 'monthly' },
    ];
    products.forEach(p => { if (p.Handle) urls.push({ loc: `${siteUrl}/#/product/${p.Handle}`, lastmod: today, priority: '0.8', changefreq: 'weekly' }); });
    return json({ urls, source: 'auto-generator' });
  } catch { return json({ urls: [{ loc: 'https://ahshop.pages.dev', lastmod: new Date().toISOString().split('T')[0], priority: '1.0', changefreq: 'daily' }] }); }
}

function handleSitemapXml() {
  const today = new Date().toISOString().split('T')[0];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://ahshop.pages.dev</loc><lastmod>${today}</lastmod><priority>1.0</priority><changefreq>daily</changefreq></url>
  <url><loc>https://ahshop.pages.dev/#/admin</loc><lastmod>${today}</lastmod><priority>0.3</priority><changefreq>monthly</changefreq></url>
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' } });
}

function handleGeoIP() {
  return json({ status: "success", country: "Saudi Arabia", countryCode: "SA", regionName: "Riyadh", city: "Riyadh", timezone: "Asia/Riyadh", currency: "SAR", lang: "ar" });
}

export default {
  async fetch(request, env, ctx) {
    try {
      if (request.method === 'OPTIONS') return corsPreflight();
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, '');
      const apiKey = env.GROQ_API_KEY || null;

      if (path === '/sitemap.xml') return handleSitemapXml();

      if (path.startsWith('/api/')) {
        if (request.method !== 'GET' && request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
        const body = request.method === 'POST' ? await request.json() : {};
        switch (path) {
          case '/api/generate-reviews': return await handleGenerateReviews(body, apiKey);
          case '/api/import-generator': return await handleImportGenerator(body, apiKey);
          case '/api/marketing-slogans': return await handleMarketingSlogans(body, apiKey);
          case '/api/description-generator': return await handleDescriptionGenerator(body, apiKey);
          case '/api/seo-tags': return await handleSeoTags(body, apiKey);
          case '/api/theme-suggestions': return await handleThemeSuggestions(body, apiKey);
          case '/api/price-optimizer': return await handlePriceOptimizer(body, apiKey);
          case '/api/category-detection': return await handleCategoryDetection(body, apiKey);
          case '/api/chatbot': return await handleChatbot(body, apiKey);
          case '/api/blog-generator': return await handleBlogGenerator(body, apiKey);
          case '/api/seo-analyzer': return await handleSeoAnalyzer(body, apiKey);
          case '/api/alt-text': return await handleAltText(body, apiKey);
          case '/api/sitemap-data': return handleSitemapData(url);
          case '/api/geoip': return handleGeoIP();
          default: return json({ error: 'Not found' }, 404);
        }
      }

      // ✅ FIXED: Use env.ASSETS for all static file requests
      // This correctly serves CSS, JS, images with proper MIME types
      const assetResponse = await env.ASSETS.fetch(request);

      // If asset found (not 404), return it directly - Cloudflare sets correct MIME types
      if (assetResponse.status !== 404) {
        const headers = new Headers(assetResponse.headers);
        headers.set('X-Frame-Options', 'DENY');
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        // For hashed assets (cache busting), set long cache
        if (path.match(/\.(css|js|webp|png|jpg|jpeg|svg|woff2)$/)) {
          headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        }
        return new Response(assetResponse.body, { status: assetResponse.status, headers });
      }

      // SPA fallback - serve index.html for all non-file routes (React Router)
      const indexResponse = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url)));
      const idxHeaders = new Headers(indexResponse.headers);
      idxHeaders.set('X-Frame-Options', 'DENY');
      idxHeaders.set('X-Content-Type-Options', 'nosniff');
      idxHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      idxHeaders.set('Cache-Control', 'public, max-age=0, must-revalidate');
      return new Response(indexResponse.body, { status: 200, headers: idxHeaders });

    } catch (error) {
      return json({ error: error.message }, 500);
    }
  }
};
