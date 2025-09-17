require("dotenv").config();

module.exports = {
  caUrl: process.env.FABRIC_CA_URL,
  peerUrl: process.env.FABRIC_PEER_URL,
  ordererUrl: process.env.FABRIC_ORDERER_URL,
  channel: process.env.FABRIC_CHANNEL_NAME,
  chaincode: process.env.FABRIC_CHAINCODE_NAME,
  walletPath: process.env.FABRIC_WALLET_PATH,
  mspId: process.env.FABRIC_MSP_ID,
  adminUser: process.env.FABRIC_ADMIN_USER,
  adminPassword: process.env.FABRIC_ADMIN_PASSWORD,
};
