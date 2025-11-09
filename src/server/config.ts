export const SERVER_CONFIG = {
  hostname: "localhost",
  development: process.env.NODE_ENV !== "production",
};

export const CHAT_CONFIG = {
  max_length: 500,
  rate_limit: {
    messages: 5,
    window_ms: 5000,
  },
};
