require("dotenv").config();

const config = {
  app: {
    env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 3000,
    frontendUrl: process.env.FRONTEND_URL,
  },
  db: {
    mongoUri: process.env.MONGODB_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpire: process.env.JWT_REFRESH_EXPIRE,
  },
  fabric: {
    caUrl: process.env.FABRIC_CA_URL,
    peerUrl: process.env.FABRIC_PEER_URL,
    ordererUrl: process.env.FABRIC_ORDERER_URL,
    channelName: process.env.FABRIC_CHANNEL_NAME,
    chaincodeName: process.env.FABRIC_CHAINCODE_NAME,
    walletPath: process.env.FABRIC_WALLET_PATH,
    mspId: process.env.FABRIC_MSP_ID,
    adminUser: process.env.FABRIC_ADMIN_USER,
    adminPassword: process.env.FABRIC_ADMIN_PASSWORD,
  },
  govtApis: {
    apiSetu: {
      baseUrl: process.env.API_SETU_BASE_URL,
      clientId: process.env.API_SETU_CLIENT_ID,
      clientSecret: process.env.API_SETU_CLIENT_SECRET,
    },
    aadhaar: {
      baseUrl: process.env.AADHAAR_API_BASE_URL,
      auaCode: process.env.AADHAAR_AUA_CODE,
      subAuaCode: process.env.AADHAAR_SUB_AUA_CODE,
      licenseKey: process.env.AADHAAR_LICENSE_KEY,
    },
    digilocker: {
      baseUrl: process.env.DIGILOCKER_API_BASE_URL,
      clientId: process.env.DIGILOCKER_CLIENT_ID,
      clientSecret: process.env.DIGILOCKER_CLIENT_SECRET,
      redirectUri: process.env.DIGILOCKER_REDIRECT_URI,
    },
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },
    encryptionKey: process.env.ENCRYPTION_KEY,
    hmacSecret: process.env.HMAC_SECRET,
  },
  fileUpload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
    allowedTypes: process.env.ALLOWED_FILE_TYPES.split(","),
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
    file: process.env.LOG_FILE || "logs/app.log",
  },
};

module.exports = config;
