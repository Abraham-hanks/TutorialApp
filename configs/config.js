const dotenv = require('dotenv');
dotenv.config();
module.exports = {
    // endpoint: process.env.API_URL,
    // masterKey: process.env.API_KEY,
    PORT: process.env.PORT,
    node_env: process.env.NODE_ENV,
    db_password: process.env.DB_PASSWORD,
    db_user_name: process.env.DB_USER_NAME,
    TOKEN_KEY: process.env.TOKEN_KEY,
    API_KEY: process.env.API_KEY
  };