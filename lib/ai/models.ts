export const DEFAULT_CHAT_MODEL: string = "gemini-flash";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Grok Vision",
    description: "Advanced multimodal model with vision and text capabilities",
  },
  {
    id: "chat-model-reasoning",
    name: "Grok Reasoning",
    description:
      "Uses advanced chain-of-thought reasoning for complex problems",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Fast and cost-effective OpenAI model for everyday tasks",
  },
  {
    id: "gemini-flash",
    name: "Gemini 2.0 Flash",
    description: "Fast and balanced Google model for everyday tasks",
  },
  {
    id: "gemini-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    description: "Lightweight and cost-effective Google model",
  },
];
