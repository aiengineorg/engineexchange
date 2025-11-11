import { registerOTel } from "@vercel/otel";

// Forcefully override localStorage for server-side rendering to fix next-auth beta issue
// The issue: localStorage exists on server but its methods aren't functions
const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((key) => delete store[key]);
  },
  key: (index: number) => Object.keys(store)[index] || null,
  get length() {
    return Object.keys(store).length;
  },
};

export function register() {
  registerOTel({ serviceName: "ai-chatbot" });
}
