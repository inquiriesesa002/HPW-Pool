# HPW Pool - Health Professional Work of Pool

A global platform connecting healthcare professionals worldwide. Find qualified health professionals across continents, countries, provinces, and cities.

## 🌟 Features

- **Global Search**: Search professionals by profession, location, experience, and ratings
- **Location Hierarchy**: Continent → Country → Province → City navigation
- **Professional Profiles**: Detailed profiles with qualifications, experience, and verification status
- **User Authentication**: Secure login/register system
- **Admin Dashboard**: Manage professionals, locations, and verifications
- **Professional Dashboard**: Manage profile, appointments, and analytics

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd HPW-Pool
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd backend
npm install
```

4. **Set up environment variables**

Create a `.env` file in the `backend` directory:
```
MONGO_URI=mongodb://localhost:27017/Company
JWT_SECRET=your-secret-key-here
PORT=5000

# Cloudinary Configuration (for image/file uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

**Note:** Cloudinary account banao: https://cloudinary.com (free tier available)

5. **Seed professions**
```bash
cd backend
node scripts/seedProfessions.js
```

6. **Start the development servers**

**Frontend:**
```bash
npm run dev
```

**Backend:**
```bash
cd backend
npm run dev
```

The frontend will run on `http://localhost:5173` and backend on `http://localhost:5000`

## 📁 Project Structure

```
HPW-Pool/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── locationController.js
│   │   ├── professionController.js
│   │   └── professionalController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── City.js
│   │   ├── Continent.js
│   │   ├── Country.js
│   │   ├── Profession.js
│   │   ├── Professional.js
│   │   ├── Province.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── locations.js
│   │   ├── professions.js
│   │   └── professionals.js
│   ├── scripts/
│   │   └── seedProfessions.js
│   └── server.js
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── SearchPage.jsx
│   │   ├── AboutPage.jsx
│   │   ├── ContactPage.jsx
│   │   ├── FAQPage.jsx
│   │   ├── BlogPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── RegisterProfessionalPage.jsx
│   │   ├── ContinentPage.jsx
│   │   ├── CountryPage.jsx
│   │   ├── ProvincePage.jsx
│   │   ├── CityPage.jsx
│   │   ├── ProfessionalProfilePage.jsx
│   │   ├── admin/
│   │   │   └── AdminDashboard.jsx
│   │   └── professional/
│   │       └── ProfessionalDashboard.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
└── package.json
```

## 🔌 API Endpoints

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
- `PUT /api/professionals/:id` - Update professional profile (Protected)

## 🎨 Color Scheme

- **Primary**: Cyan/Teal (#06B6D4, #0891B2)
- **Secondary**: Green (#10B981)
- **Accent**: Blue (#3B82F6)

## 📝 License

MIT License

## 👥 Contact

HPW Pool Team
Email: info@hpwpool.com

---

© 2024 HPW Pool - Health Professional Work of Pool. All rights reserved.
