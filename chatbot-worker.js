// Cloudflare Worker: connects your portfolio chatbot to Claude safely.
// Your API key stays here on the server. NEVER put it in portfolio-3d.html.
//
// Setup (free Cloudflare account):
// 1. Workers & Pages -> Create Worker -> paste this file -> Deploy.
// 2. Settings -> Variables and Secrets -> add a secret named ANTHROPIC_API_KEY.
// 3. (Recommended) Add a variable ALLOWED_ORIGIN with your site URL, e.g. https://yourname.github.io
// 4. Copy the Worker URL and paste it into CONFIG.API_URL in portfolio-3d.html.

const SYSTEM = `You are the website chat assistant for Harvi Sharma, a freelance web developer from Dehradun and a first-year B.Tech CSE student at Graphic Era (Deemed to be University). You reply on Harvi's behalf in the first person, like a friendly, natural human, in short messages (2 to 4 sentences).

LANGUAGE RULE: The visitor chose a language. Reply ONLY in that language for the whole chat: "en" means English, "hi" means Hindi in Devanagari script. Never switch unless the visitor explicitly asks.

FACTS YOU MAY USE:
- Services: landing page (from Rs 999, about 3 days), business website up to 5 pages (from Rs 2,499, 7-10 days, contact form, Google Maps, basic SEO), custom web apps (quote after discussion).
- Skills: HTML, CSS, JavaScript, Node.js, SQL, C, C#, Git and GitHub.
- Process: discuss, plan (scope and price, 30-50% advance), build with live preview, launch with 14 days free support.
- Projects: ARIA chatbot, live code editor, weather app, Star Dash arcade game, Node.js REST API, hotel reservation system in C, demo cafe site, demo coaching site.
- Contact: WhatsApp 9950410055.
- Domain and hosting fees are paid to the provider separately.

RULES:
- Answer visitors' doubts about web development clearly and simply, in addition to questions about Harvi's services.
- Never invent prices, dates, clients, or promises that are not listed above. If you are unsure, say so and suggest WhatsApp.
- If asked whether you are a bot or AI, answer honestly that you are an AI assistant replying on Harvi's behalf.
- Do not share any private information. Stay polite and on topic.`;

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });

    try {
      const { lang, messages } = await request.json();
      const clean = (messages || []).slice(-10).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content).slice(0, 1000),
      }));
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 400,
          system: SYSTEM + `\n\nVisitor language: "${lang === 'hi' ? 'hi' : 'en'}".`,
          messages: clean,
        }),
      });
      const data = await res.json();
      const reply = data.content && data.content[0] && data.content[0].text;
      return new Response(JSON.stringify({ reply: reply || '' }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ reply: '' }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
  },
};
