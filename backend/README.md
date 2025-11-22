# Backend Setup - HPW Pool

## 📁 Structure

```
backend/
├── config/
│   ├── cloudinary.cjs      # Cloudinary configuration
│   └── database.cjs         # MongoDB connection
├── controllers/
│   ├── adminController.cjs
│   ├── authController.cjs
│   ├── companyController.cjs
│   ├── jobController.cjs
│   ├── locationController.cjs
│   ├── professionController.cjs
│   ├── professionalController.cjs
│   ├── traineeController.cjs
│   └── uploadController.cjs
├── middleware/
│   ├── auth.cjs             # JWT authentication
│   └── upload.cjs            # File upload with Cloudinary
├── models/
│   ├── City.cjs
│   ├── Company.cjs
│   ├── Continent.cjs
│   ├── Country.cjs
│   ├── Job.cjs
│   ├── Profession.cjs
│   ├── Professional.cjs
│   ├── Province.cjs
│   ├── Trainee.cjs
│   └── User.cjs
├── routes/
│   ├── admin.cjs
│   ├── auth.cjs
│   ├── companies.cjs
│   ├── jobs.cjs
│   ├── locations.cjs
│   ├── professions.cjs
│   ├── professionals.cjs
│   ├── trainees.cjs
│   └── upload.cjs
└── server.cjs                # Main Express server
```

## 🔧 Environment Variables

Create a `.env` file in the root directory with:

```env
MONGODB_URI=mongodb+srv://inquiriesesa_db_user:9OOQm5boLEOdNZsi@cluster0.ktqsjbu.mongodb.net/?appName=Cluster0
JWT_SECRET=your-secret-key-change-in-production
CLOUDINARY_CLOUD_NAME=dakbch74l
CLOUDINARY_API_KEY=595899943319583
CLOUDINARY_API_SECRET=IXoQKDAdHLCWMgOVQyeHk3Lr6v4
PORT=5000
NODE_ENV=development
```

## 🚀 Local Development

```bash
# Install dependencies (from root)
npm install

# Start backend server
npm run backend
# or
node backend/server.cjs
```

## ☁️ Cloudinary Setup

All image and document uploads use Cloudinary. The configuration is in `backend/config/cloudinary.cjs`.

### Upload Types:
- **Images**: Profile pictures, company logos, job images
- **Documents**: CVs, resumes, certificates

### Upload Folders:
- `hpw-pool/images` - General images
- `hpw-pool/professionals/avatars` - Professional avatars
- `hpw-pool/professionals/cvs` - Professional CVs
- `hpw-pool/companies/logos` - Company logos
- `hpw-pool/jobs/images` - Job images
- `hpw-pool/trainees/avatars` - Trainee avatars
- `hpw-pool/documents` - General documents

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Locations
- `GET /api/locations/continents` - Get all continents
- `GET /api/locations/countries?continentId=xxx` - Get countries
- `GET /api/locations/provinces?countryId=xxx` - Get provinces
- `GET /api/locations/cities?provinceId=xxx` - Get cities

### Professions
- `GET /api/professions` - Get all professions
- `GET /api/professions/:id` - Get profession by ID
- `POST /api/professions` - Create profession (Admin only)

### Professionals
- `GET /api/professionals/stats` - Get statistics
- `GET /api/professionals` - Get all professionals (with filters)
- `GET /api/professionals/:id` - Get professional by ID
- `POST /api/professionals` - Create professional profile (Protected)
- `PUT /api/professionals` - Update professional profile (Protected)
- `POST /api/professionals/cv` - Upload CV (Protected)

### Companies
- `GET /api/companies` - Get all companies
- `GET /api/companies/:id` - Get company by ID
- `POST /api/companies` - Create company profile (Protected)
- `PUT /api/companies` - Update company profile (Protected)

### Jobs
- `GET /api/jobs` - Get all jobs (with filters)
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create job (Protected)
- `PUT /api/jobs/:id` - Update job (Protected)
- `DELETE /api/jobs/:id` - Delete job (Protected)

### Trainees
- `GET /api/trainees` - Get all trainees
- `GET /api/trainees/:id` - Get trainee by ID
- `POST /api/trainees` - Create trainee profile (Protected)
- `PUT /api/trainees` - Update trainee profile (Protected)

### Upload
- `POST /api/upload/image` - Upload image (Protected)
- `POST /api/upload/document` - Upload document (Protected)
- `DELETE /api/upload/file` - Delete file from Cloudinary (Protected)

### Admin
- `GET /api/admin/stats` - Get dashboard stats (Admin only)
- `GET /api/admin/users` - Get all users (Admin only)
- `GET /api/admin/professionals` - Get all professionals (Admin only)
- `PUT /api/admin/professionals/:id/verify` - Verify professional (Admin only)
- `GET /api/admin/companies` - Get all companies (Admin only)
- `GET /api/admin/jobs` - Get all jobs (Admin only)

## 🔒 Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📝 Notes

- All files use `.cjs` extension for CommonJS compatibility
- MongoDB connection is handled with connection pooling for Vercel
- Cloudinary is required for file uploads (no local storage on Vercel)
- The server automatically detects Vercel environment and adjusts accordingly

