import { apiClient } from "./axios";

export const aiApi = {
  chat: (messages) => apiClient.post("/ai/chat", { messages }),
};
