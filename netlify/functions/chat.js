// Groq 중계 함수: API 키는 Netlify 환경변수(GROQ_API_KEY)에서만 읽습니다.
exports.handler = async (event) => {
  const json = (code, obj) => ({
    statusCode: code,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  });

  if (event.httpMethod !== 'POST') return json(405, { error: { message: 'POST만 가능합니다.' } });

  const key = process.env.GROQ_API_KEY;
  if (!key) return json(500, { error: { message: '서버에 GROQ_API_KEY가 설정되지 않았어요.' } });

  let messages;
  try {
    messages = JSON.parse(event.body || '{}').messages;
  } catch (e) {
    return json(400, { error: { message: '잘못된 요청입니다.' } });
  }
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 12) {
    return json(400, { error: { message: '메시지 형식이 올바르지 않아요.' } });
  }
  messages = messages.map(m => ({
    role: ['system', 'user', 'assistant'].includes(m.role) ? m.role : 'user',
    content: String(m.content || '').slice(0, 4000)
  }));

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'openai/gpt-oss-120b', messages, max_tokens: 300, temperature: 0.7 })
    });
    const data = await r.json();
    return json(r.status, data);
  } catch (e) {
    return json(502, { error: { message: 'AI 서버에 연결하지 못했어요.' } });
  }
};
