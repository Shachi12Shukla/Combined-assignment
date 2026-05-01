const jwt = require("jsonwebtoken");
const jwtPassword = 'my-secret';

/**
 * Generates a "Short-Lived" JWT that expires in 1 minute.
 * * @param {string} username - The user's email.
 * @returns {string} A JWT that will be invalid after 60 seconds.
 */
function signShortLivedToken(username) {
    // Your code here
    return jwt.sign({username}, jwtPassword, {expiresIn : '1m'});
};

/**
 * Checks if a token is still valid or has expired.
 * * @param {string} token - The JWT string.
 * @returns {string} Returns "valid", "expired", or "invalid".
 */
function checkTokenStatus(token) {
    // Your code here
    try{
        jwt.verify(token, jwtPassword);
        return "valid";
    }

    catch(err){
        if(err.name === 'TokenExpiredError'){       // jwt library provides an error class called 'TokenExpiredError'
            return "expired";
        }
        return "invalid";     // covers wrong password , malformed strings, etc.
    }
};


module.exports = {
    signShortLivedToken,
    checkTokenStatus,
    jwtPassword
}