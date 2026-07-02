# Beacon Bank API

> A robust, secure, and production-ready banking API demonstrating enterprise-grade backend engineering, strict security philosophies, and transactional integrity.

Beacon Bank API is a comprehensive backend system designed to handle sensitive financial operations securely. Built with Node.js and Express, it features strict Role-Based Access Control (RBAC), atomic database operations for financial transactions, and a hardened security perimeter.

This project serves as a showcase of senior-level backend development, focusing on clean architecture, service-layer abstraction, and rigorous validation.

## 🛠 Tech Stack

**Core Backend:** Node.js, Express.js
**Database & ODM:** MongoDB, Mongoose
**Security & Auth:** JWT (JSON Web Tokens), bcryptjs, Helmet, Express Rate Limit, XSS-Clean, Joi (Validation)
**Logging & Utilities:** Winston (Daily Rotate File), Node-Cron, Request-IP
**Testing & Docs:** Jest, Supertest, Swagger UI Express

## 🏗 Key Engineering Features

- **Transaction Integrity & Concurrency Control:** Implemented atomic database updates (using MongoDB's `$inc`, `$gte`, `$lte` operators via `findOneAndUpdate`) to prevent race conditions during concurrent money transfers, deposits, and withdrawals. This guarantees that balances never drop below zero or exceed maximum limits, ensuring ACID-like consistency without heavy locking mechanisms.
- **Service-Oriented Architecture:** Business logic is decoupled from controllers into dedicated services (e.g., `TransactionService`, `AccountService`). This ensures modularity, easier testing, and clear separation of concerns.
- **Advanced Role-Based Access Control (RBAC):** Distinct permission hierarchies (`customer`, `admin`, `superadmin`) enforced via custom authorization middlewares, effectively segregating user operations from administrative control panels.
- **Automated Scheduled Tasks:** Integrated `node-cron` for automated system tasks (e.g., resetting daily transfer/withdrawal limits).
- **Comprehensive Auditing & Logging:** Centralized logging architecture using `winston` with daily rotation. Records critical system events, errors, and transaction failures for full observability.

## 🛡 Security Philosophy

Security is a first-class citizen in this application, implemented across multiple layers:

- **Authentication & Authorization:** Stateless, secure JWT authentication. Passwords are salted and hashed using `bcryptjs` prior to storage.
- **Data Sanitization:** Defense against Cross-Site Scripting (XSS) using `xss-clean` and strict payload validation via `Joi` schemas to prevent NoSQL injection and malformed requests.
- **Network Security:** HTTP headers are hardened using `helmet`. Brute-force attacks and DDoS mitigation are handled via `express-rate-limit`.
- **IP Tracking:** `request-ip` is utilized for tracking request origins, crucial for fraud detection and audit trailing on sensitive endpoints.
- **Strict Business Constraints:** Hardcoded financial limits (e.g., daily maximums, minimum transfer amounts) validated continuously at the service layer.

## 🚀 Setup Instructions

Follow these steps to run the application locally:

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Bank-Application

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Create a .env file in the root directory and add:
# PORT=3000
# MONGO_URI=mongodb://localhost:27017/beacon_bank
# JWT_SECRET=your_super_secret_key
# JWT_LIFETIME=1d

# 4. (Optional) Run the dummy database seeder
npm run setup:dummy-db

# 5. Start the development server
npm run dev
```

To run the test suite:
```bash
npm test
```

## 📚 API Documentation Summary

The application is split into distinct functional modules. Below is a high-level overview of the exposed endpoints:

### User Routes (`/api/v1/user`)
* **Public:**
  * `POST /register` - Register a new customer account
  * `POST /login` - Authenticate and retrieve JWT
  * `POST /verify/:token` - Verify email address
* **Protected (Requires `customer` role):**
  * `GET /accounts` - Retrieve user's linked accounts
  * `GET /balance/:accountNumber` - Check specific account balance
  * `GET /transactions/history/:accountNumber` - View transaction history
  * `POST /transfer` - Initiate an internal money transfer
  * `POST /resend-verification` - Resend email verification

### Admin Routes (`/api/v1/admin`)
* **Public:**
  * `POST /login` - Admin authentication
* **Protected (Requires `admin` or `superadmin` role):**
  * `POST /users/accounts` - Provision a new bank account for a user
  * `PUT /users/accounts/update` - Modify account status/limits
  * `PUT /users/data/update` - Update user personal data
* **Protected (Requires `superadmin` role):**
  * `POST /register` - Provision a new administrative user
  * `PUT /update` - Update administrative access tiers
