// Telekom OAuth configuration
export const telekomOAuthConfig = {
  authorizationEndpoint: "https://accounts.login.idm.telekom.com/oauth2/auth",
  tokenEndpoint: "https://accounts.login.idm.telekom.com/oauth2/token",
  clientId: process.env.TELEKOM_CLIENT_ID || "YOUR_CLIENT_ID", // Replace with your actual client ID
  redirectUri: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
    : "http://localhost:3000/api/auth/callback",
  scope: "openid profile email",
}
