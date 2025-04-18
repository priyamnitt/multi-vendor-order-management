require('dotenv').config();

module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  roles: {
    CUSTOMER: 'CUSTOMER',
    VENDOR: 'VENDOR',
    ADMIN: 'ADMIN'
  }
}; 