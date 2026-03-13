
export type MODE = "wit" | "ask" | "code" | "explain" | "summerize";

export type Transcript = {
  chat: "private" | "group",
  sender: string,
  content: string
};

export type ChatHistory = {
  role: string;
  message: string
}