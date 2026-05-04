import jwt from "jsonwebtoken";

const defaultAccessSecret = "novabank-dev-access-secret";
const defaultRefreshSecret = "novabank-dev-refresh-secret";
const accessSecret = process.env.JWT_SECRET || defaultAccessSecret;
const refreshSecret = process.env.JWT_REFRESH_SECRET || defaultRefreshSecret;

export const accessTokenExpiry = "15m";
export const refreshTokenExpiry = "7d";

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName
    },
    accessSecret,
    { expiresIn: accessTokenExpiry }
  );
}

export function signRefreshToken({ userId, tokenId }) {
  return jwt.sign(
    {
      sub: userId,
      tokenId,
      tokenType: "refresh"
    },
    refreshSecret,
    { expiresIn: refreshTokenExpiry }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret);
}
