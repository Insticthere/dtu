# National Legal Metrology Verification System (e-Metrology) - MVP

A full-stack, production-ready MVP of a web-based **Legal Metrology Verification System** that digitizes the statutory verification and certification workflow for commercial weighing and measuring instruments (weighing scales, weighbridges, fuel dispensers, evidential breath analysers, etc.) under India's **Legal Metrology Act, 2009** and **Legal Metrology (General) Rules, 2011**.

---

## 🚀 Key Features

1. **Role-Based Access Control (RBAC)**:
   - **Trader / User**: Owns instruments, tracks verification expiry, and submits online verification / re-verification applications.
   - **LMO (Legal Metrology Officer)**: Schedules inspections, records tolerance tests, affixes seal numbers, and issues statutory certificates.
   - **GATC (Government Approved Test Centre)**: Conducts precision laboratory calibrations and testing for specialized instruments (e.g. Evidential Breath Analysers).
   - **Admin (Controller of Legal Metrology)**: Monitors state-wide pendency and overdue instruments, allocates applications, and dynamically configures instrument categories.
   - **Public (No Login Required)**: Instant verification of certificate authenticity by scanning QR codes or entering certificate numbers.

2. **Dynamic Inspection Schemas per Category**:
   - Dynamic schema engine enables adding new instrument categories (e.g., *Evidential Breath Analyser*, *Automatic Fuel Dispenser*, *Laser Speed Gun*) with custom tolerance test checkpoints and units without modifying code.

3. **Cryptographic QR Code Verification**:
   - Generates unique, unguessable cryptographic tokens embedded in QR codes linking to `https://<domain>/verify/<qrToken>`.
   - Displays real-time validity status, masked owner details (e.g. `R***h S***a`), category, and issuing officer credentials.

4. **Statutory Digital Certificate & PDF Generation**:
   - Official Government certificate document styled with national emblem aesthetics, statutory declaration under Section 44, and officer digital seal.
   - Downloadable as a standalone PDF or printable directly from the portal.

5. **Automated Expiry Notification Engine**:
   - Automated background cron job monitors instrument validity and generates multi-tier notifications at **60, 30, and 7 days** prior to statutory expiry.

6. **Abstracted File Storage**:
   - File storage provider interface with `LocalStorageProvider` and an `S3StorageProvider` stub ready for AWS S3 deployment.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, MongoDB Atlas (with automated In-Memory MongoDB fallback for instant local evaluation), Mongoose ODM, JWT Auth, PDFKit, QRCode, Node-Cron, Multer.
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, React Router v7, Axios, QRCode.react, jsPDF, html2canvas.

---

## 📁 Project Structure

```
/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB Atlas & In-Memory connection
│   │   ├── models/          # Mongoose Schemas (User, Instrument, Category, Application, InspectionRecord, Certificate, Notification)
│   │   ├── middleware/      # JWT Auth & Multer upload middleware
│   │   ├── services/        # Storage Provider, QR Generation, PDFKit Certificate, Notification Dispatch
│   │   ├── jobs/            # Daily Expiry Check Cron Job (60/30/7 days)
│   │   ├── routes/          # RESTful Endpoints (Auth, Instruments, Applications, Inspections, Certificates, Verify, Dashboard, Admin)
│   │   ├── seed/            # Comprehensive Seed Dataset
│   │   ├── testIntegration.js # Automated 11-step End-to-End integration test
│   │   ├── app.js           # Express App Configuration
│   │   └── server.js        # Server Entrypoint
│   ├── uploads/             # Storage folder for uploaded photos & PDFs
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API Client with JWT Interceptors
│   │   ├── context/         # AuthContext with persistent session & notifications
│   │   ├── components/      # Navbar, Footer, StatusBadge, DynamicInspectionForm, DynamicSchemaBuilder, CertificateDocument
│   │   ├── pages/           # Landing, Login, Register, UserDashboard, AddInstrument, ApplyVerification, ApplicationDetail, OfficerDashboard, PerformInspection, AdminDashboard, AdminCategories, CertificatePage, PublicVerifyPage
│   │   ├── App.jsx          # Route Definitions
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js       # Vite proxy to backend port 5000
│   ├── tailwind.config.js
│   └── package.json
├── package.json             # Root runner
└── README.md
```

---

## ⚙️ Environment Variables

Create `.env` in `/backend` (copied automatically from `.env.example`):

```env
PORT=5000
# Leave empty or provide MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/legal_metrology?retryWrites=true&w=majority
JWT_SECRET=legal_metrology_jwt_secret_key_super_secure_2026
BASE_URL=http://localhost:5173
STORAGE_PROVIDER=local
AWS_S3_BUCKET=legal-metrology-docs
AWS_REGION=ap-south-1
```

> **Note**: If `MONGODB_URI` is omitted or unable to connect to Atlas, the backend automatically initializes an in-memory MongoDB database and auto-seeds the data for instant out-of-the-box local testing.

---

## 🚀 Getting Started (Run Locally)

### 1. Install Dependencies
```bash
# In backend
cd backend && npm install

# In frontend
cd ../frontend && npm install
```

### 2. Seed Database (Optional - also runs automatically if DB is empty)
```bash
cd backend && npm run seed
```

### 3. Start Backend & Frontend
```bash
# Terminal 1: Backend (runs on http://localhost:5000)
cd backend && npm run dev

# Terminal 2: Frontend (runs on http://localhost:5173)
cd frontend && npm run dev
```

Or from the root directory:
```bash
npm run dev
```

### 4. Run Automated End-to-End Tests
```bash
cd backend && node src/testIntegration.js
```

---

## 🔑 Pre-Seeded Demo Credentials

All accounts use the password: **`password123`**

| Role | Email | Description |
|---|---|---|
| **Admin HQ** | `admin@metrology.gov.in` | Controller: allocate applications, view state stats, add dynamic categories |
| **LMO Officer** | `lmo.verma@metrology.gov.in` | Legal Metrology Inspector: schedule visits, perform inspections, issue certificates |
| **GATC Lab** | `gatc.lab@testcentre.org` | Govt Approved Test Centre: precision lab calibrations (e.g. Breath Analysers) |
| **Trader / User 1** | `ramesh.traders@gmail.com` | Ramesh Kirana & Wholesale Commodities: owns scale & fuel dispenser |
| **Trader / User 2** | `delhi.hospital@medhealth.in` | City Trauma Center: owns Evidential Breath Analyser |

---

## 🧪 Sample Verification URLs & Tokens

- **Public Verification URL**: `http://localhost:5173/verify/4f8a92e10bc78d234a5b6c7d8e9f0123`
- **Certificate View Page**: `http://localhost:5173/certificates/LM-VER-2026-908123`
- **Public Certificate Search**: Enter `LM-VER-2026-908123` on the Landing Page or `/verify`

---

## 📜 Statutory Standards Covered Out of the Box

1. **Electronic Weighing Scale (Class III)** — *Schedule VIII, Legal Metrology Rules 2011* (Tolerance tests at min/half/max load, eccentricity corner load test, zero setting test, repeatability test).
2. **Evidential Breath Analyser (EBA)** — *OIML R 126 & Legal Metrology Rules* (Accuracy at 0.020%, 0.050%, and 0.080% BAC concentrations, 24-hour calibration drift check, blank zero baseline test).
3. **Automatic Fuel Dispenser (Petrol/Diesel)** — *Schedule IX, Legal Metrology Rules 2011* (Delivery accuracy on 5L, 10L, 20L conical measures, electronic vs mechanical totalizer synchronization, pulser lead seal verification).
