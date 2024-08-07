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
        Review the code and return JUST a list of lists in the format [[startIndex, endIndex, feedback], [startIndex, endIndex, feedback], ...]
        where startIndex is the first line (inclusive) of a complex portion of code, endIndex
        is the last line (inclusive) of a portion of complex code, and feedback is some feedback on how
        to document the code better and make it more straightforward. The focus should be on explaining how to improve. 
        Include as many portions of complex code as needed.
        The given code is indexed by a line number, followed by a ~ character, and then the code itself. Please use these line numbers to specify the startIndex and endIndex.
        A complex portion of code is defined as any block that may be ambiguous to someone who is not familiar with the code. Here is the code: 
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
              content: "You are a concise and precise code reviewer who is identifying a complex portion of code in a larger codebase. Return ONLY a list with 3 values where the first represents startIndex and the second represents endIndex and the third represents feedback. It is CRUCIAL that you ONLY return the list specified. However, the feedback can be as long as needed. Make sure there is enough whitespace between each respective question. Maybe output a whole line worth of space between questions. The user should know each question is different. The feedback should be in 3 parts: 1. What is the code doing? 2. How does it intertwine with the rest of the code? Ensure you refer to at least one other part of the program when providing your response, but ONLY through line number, NEVER through actual code. 3. What are some technical details that make this code complex? Ensure you refer to at least one technical detail in the program, but ONLY through line number, NEVER through actual code. Where applicable, reference relevant sections from your previous knowledge of Python to supplement your answers. NEVER use real Python code in your response."
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
      return res.status(200).json({ indices: data.responseContent.trim() });
    } catch (error) {
      return res.status(500).json({ error: "Failed to process request" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
