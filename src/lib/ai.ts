export type MessageContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail?: "auto" | "low" | "high" }
  | { type: "input_audio"; audio_url?: string; input_audio?: { data: string; format: string } }
  | { type: "refusal"; refusal: string };

export type InputMessage = {
  role: "user" | "assistant" | "system";
  content: string | MessageContentPart[];
};

export type GenerateResponseOptions = {
  model: string;
  instructions?: string;
  input: InputMessage[];
  max_output_tokens?: number;
};

export class GatewayError extends Error {
  code: string;
  ids: string[];

  constructor(code: string, message: string, ids: string[] = []) {
    super(message);
    this.name = "GatewayError";
    this.code = code;
    this.ids = ids;
  }
}

function normalizeContent(content: string | MessageContentPart[]) {
  if (typeof content === "string") return content;

  return content.map((part) => {
    switch (part.type) {
      case "input_text":
        return { type: "text", text: part.text };
      case "input_image":
        return { type: "image_url", image_url: { url: part.image_url, detail: part.detail ?? "auto" } };
      default:
        return { type: "text", text: "" };
    }
  });
}

export async function generateResponse(options: GenerateResponseOptions) {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? process.env.AI_BASE_URL ?? "https://api.openai.com/v1";

  if (!apiKey) {
    throw new GatewayError("missing_credentials", "AI credentials are missing from the server environment.", []);
  }

  const messages = [
    ...(options.instructions ? [{ role: "system" as const, content: options.instructions }] : []),
    ...options.input.map((message) => ({
      role: message.role,
      content: normalizeContent(message.content),
    })),
  ];

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model,
      messages,
      max_tokens: options.max_output_tokens ?? 2000,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const code = response.status === 402 ? "payment_required" : "generation_failed";
    throw new GatewayError(code, `AI request failed (${response.status}): ${body || response.statusText}`, [body]);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; text?: string }>; 
      };
    }>;
  };

  const firstChoice = data.choices?.[0]?.message?.content ?? "";
  const text = typeof firstChoice === "string"
    ? firstChoice
    : Array.isArray(firstChoice)
      ? firstChoice.map((part) => part.text ?? "").join("")
      : "";

  return {
    output: [
      {
        type: "message",
        content: [
          {
            type: "output_text",
            text,
          },
        ],
      },
    ],
  };
}
