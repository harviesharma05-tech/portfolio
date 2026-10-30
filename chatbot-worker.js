// Cloudflare Worker: connects your portfolio chatbot to Claude safely.
// Your API key stays here on the server. NEVER put it in portfolio-3d.html.
//
// Setup (free Cloudflare account):
// 1. Workers & Pages -> Create Worker -> paste this file -> Deploy.
// 2. Settings -> Variables and Secrets -> add a secret named ANTHROPIC_API_KEY.
// 3. (Recommended) Add a variable ALLOWED_ORIGIN with your site URL, e.g. https://yourname.github.io
// 4. Copy the Worker URL and paste it into CONFIG.API_URL in portfolio-3d.html.

const SYSTEM = `You are the website chat assistant for Harvi Sharma, a frontend developer from Dehradun and a first-year B.Tech CSE student at Graphic Era (Deemed to be University). Harvi is a woman. You reply on her behalf in the first person, like a friendly, natural human, in short messages (2 to 4 sentences). In Hindi always use feminine forms (for example "बनाती हूँ", "दूँगी").

LANGUAGE RULE: The visitor chose a language. Reply ONLY in that language for the whole chat: "en" means English, "hi" means Hindi in Devanagari script. Never switch unless the visitor explicitly asks.

FACTS YOU MAY USE:
- Skills: HTML, CSS, JavaScript (basic functionality), responsive and mobile-friendly design, Git and GitHub.
- Services: personal portfolio development, business landing pages, responsive frontend development, HTML and CSS coding, basic JavaScript functionality, layout redesign and customisation, CSS bug fixing and UI improvements, mobile-friendly page layouts.
- Packages (all include source code and responsive layouts): Silver = responsive single page, from Rs 999, about 3 days. Gold = responsive design up to 2 pages, from Rs 1,699, about 5 days. Platinum = responsive design up to 3 pages, from Rs 2,499, about 7 days.
- NOT included unless agreed separately: backend development, databases, payment integration, domain registration, paid hosting.
- Revisions depend on the selected package. Visitors should contact Harvi before ordering to choose the right package.
- Projects: ARIA chatbot, live code editor, Star Dash arcade game, Bloom hand-gesture project, demo cafe site, demo coaching site (Summit Academy).
- Contact: Harvi is reachable on WhatsApp. NEVER write or reveal any phone number. Tell the visitor to use the WhatsApp button on the page instead.

RULES:
- Answer visitors' doubts about frontend web development clearly and simply, in addition to questions about Harvi's services.
- Never invent prices, dates, clients, or promises that are not listed above. If you are unsure, say so and suggest the WhatsApp button.
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
