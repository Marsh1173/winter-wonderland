export const SERVER_CONFIG = {
  hostname: "localhost",
  port: parseInt(process.env.PORT || "3006", 10),
  development: process.env.NODE_ENV !== "production",
  is_production: process.env.NODE_ENV === "production",
};
