export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { input_string } = req.body;

    if (!input_string) {
      return res.status(400).json({ error: "input_string is missing" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key is missing" });
    }

    try {
      const userContent = `
        Review the following code and return an integer value from 1 - 100 rating how good you think the code 
        is based on documentation and straightforwardness. Also give a justification for the score that explains
        how it could be done better. Focus the justification on providing feedback. 
        IMPORTANT: Format the response as an object with keys score and justification. Code: 
      ${input_string}`;

      const response = await fetch('https://api.groq.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are a concise and precise code reviewer. Give an integer from 1 to 100 rating the code and a justification for how to improve the readability and straightforwardness. IMPORTANT: ONLY return a JSON object with score and justification IN THIS FORMAT: { score: ___, justification: ___ }. I REPEAT DO NOT USE ANY OTHER FORMAT. Do not put any newline characters in the desired object. Anytime you refer to code, only use line numbers and never include code in your justification."
            },
            {
              role: "user",
              content: userContent
            },
          ],
          temperature: 0,
          max_tokens: 1024,
          top_p: 1,
        }),
      });

      const data = await response.json();
      return res.status(200).json({ score: data.responseContent.trim() });
    } catch (error) {
      return res.status(500).json({ error: "Failed to process request" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
