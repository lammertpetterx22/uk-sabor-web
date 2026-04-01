export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Legacy Forge config - kept for backward compatibility with other features
  // For video streaming, use Bunny.net instead
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Bunny.net configuration
  bunnyApiKey: process.env.BUNNY_API_KEY ?? process.env.BUNNY_STORAGE_API_KEY ?? "",
  bunnyStorageZone: process.env.BUNNY_STORAGE_ZONE ?? "uk-sabor",
  bunnyCdnUrl: process.env.BUNNY_CDN_URL ?? "https://uk-sabor.b-cdn.net",
};
