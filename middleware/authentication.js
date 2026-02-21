const { validateTokenForUser } = require("../auth");

function checkForAuthenticationCookie(cookieName) {
  return (req, res, next) => {
    const tokenCookieValue = req.cookies[cookieName];

    if (!tokenCookieValue) {
      return next();
    }
    try {
      const userPayload = validateTokenForUser(tokenCookieValue);
      req.user = userPayload;
    } catch (error) {
      return next();
    }

    return next();
  };
}

module.exports = { checkForAuthenticationCookie };
