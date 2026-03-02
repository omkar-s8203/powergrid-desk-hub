import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("chatbot responds with Gemini model", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/chatbot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      message: "Hello, what can you help me with?",
      role: "employee",
      userId: null,
    }),
  });

  const body = await response.text();
  console.log("Status:", response.status);
  console.log("Response:", body);

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}: ${body}`);
  }

  const data = JSON.parse(body);
  if (!data.response || data.response.length === 0) {
    throw new Error("Empty response from chatbot");
  }

  console.log("Bot response:", data.response);
});
