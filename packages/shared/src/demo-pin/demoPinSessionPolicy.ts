export const demoPinSessionPolicy = {
  storageKind: "sessionStorage",
  persistence: "current_browser_session_only",
  storedFields: ["unlocked", "unlockedAtMs"] as const,
  forbiddenStoredFields: ["pin", "pinInput", "authToken", "identity", "phi"] as const,
  demoOnly: true,
  productionAuthentication: false,
  realSecurity: false,
  phiProtection: false
} as const;

export type DemoPinSessionPolicy = typeof demoPinSessionPolicy;
