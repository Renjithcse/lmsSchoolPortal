const jwt = require("jsonwebtoken");

//* Cookie options *************************************************

const isHttpsFrontend =
  process.env.NODE_ENV === "production" &&
  (process.env.FRONTEND_URL || "").startsWith("https");

const cookieOptions = (maxAge) => ({
  // maxAge,
  httpOnly: true,
  path: "/",
  sameSite: isHttpsFrontend ? "none" : "lax",
  secure: isHttpsFrontend,
});

//* Create tokens **************************************************

const createTokens = async (user) => {
  // Enhanced token payload with more user information
  const tokenPayload = {
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
    phone: user.phone,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    active: user.active
  };

  const accessToken = jwt.sign(
    tokenPayload,
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_EXPIRES_IN }
  );

  const refreshDays = Number(process.env.REFRESH_COOKIE_EXPIRES_IN) || 30;
  user.refreshTokens.push({
    token: refreshToken,
    expiresIn: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
  });
  if (!user.active) user.active = true; // To activate deactivated account
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

//* Decode token utilities *****************************************

const decodeToken = (token, secret = process.env.ACCESS_TOKEN_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

const extractUserFromToken = (token) => {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  
  return {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    name: decoded.name,
    phone: decoded.phone,
    emailVerified: decoded.emailVerified,
    phoneVerified: decoded.phoneVerified,
    active: decoded.active
  };
};

const extractUserIdFromToken = (token) => {
  const decoded = decodeToken(token);
  return decoded?.id || null;
};

const extractUserRoleFromToken = (token) => {
  const decoded = decodeToken(token);
  return decoded?.role || null;
};

//* Send Cookies ***************************************************

const sendCookies = (res, accessToken, refreshToken) => {
  res.cookie(
    "access",
    accessToken,
    cookieOptions(process.env.ACCESS_COOKIE_EXPIRES_IN)
  );
  res.cookie(
    "refresh",
    refreshToken,
    cookieOptions(process.env.REFRESH_COOKIE_EXPIRES_IN)
  );
};

//* Create tokens and send Cookies *********************************

const createTokensAndCookies = async (user, res) => {
  const { accessToken, refreshToken } = await createTokens(user);
  sendCookies(res, accessToken, refreshToken);

  return accessToken;
};

//* remove cookies *************************************************

const removeCookies = (res) => {
  res.cookie("access", "", cookieOptions(1));
  res.cookie("refresh", "", cookieOptions(1));
};

module.exports = {
  cookieOptions,
  createTokens,
  sendCookies,
  createTokensAndCookies,
  removeCookies,
  decodeToken,
  extractUserFromToken,
  extractUserIdFromToken,
  extractUserRoleFromToken,
};
