# SkillShare

A full-stack community marketplace connecting local service providers with customers.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- Google Cloud Console project (for OAuth)
- Stripe account (for payments)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Fill in your .env.local values
npm run dev
```

## 🌐 Deployment

### Backend Deployment (Railway/Render/Heroku)

1. **Create a new project** on your deployment platform
2. **Connect your GitHub repository**
3. **Set root directory** to `backend`
4. **Add environment variables** from `.env.example`
5. **Set build command**: `npm install`
6. **Set start command**: `npm start`

#### Required Environment Variables:
| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `NODE_ENV` | Set to `production` |
| `ALLOWED_ORIGINS` | Your frontend URL(s), comma-separated |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `EMAIL_USER` | Gmail address for sending emails |
| `EMAIL_PASS` | Gmail app password |
| `FRONTEND_URL` | Your frontend URL |

### Frontend Deployment (Vercel)

1. **Import your GitHub repository** to Vercel
2. **Set root directory** to `frontend`
3. **Add environment variables**:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BACKEND_API_URL` | Your deployed backend URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

4. **Deploy!**

### Post-Deployment Checklist

- [ ] Update Google Cloud Console with production OAuth URLs
- [ ] Update Stripe webhook URL to production backend
- [ ] Test all authentication flows
- [ ] Test payment flow with Stripe test mode
- [ ] Verify CORS is working correctly

## 📁 Project Structure

```
SkillShare/
├── backend/
│   ├── config/         # Database configuration
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   └── server.js       # Entry point
│
└── frontend/
    ├── src/
    │   ├── components/ # React components
    │   ├── pages/      # Next.js pages
    │   └── styles/     # CSS modules
    └── public/         # Static assets
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update-profile` - Update profile
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Services
- `GET /api/services` - Get all services (with geo filter)
- `POST /api/services` - Create service
- `GET /api/services/my` - Get user's services
- `GET /api/services/:id` - Get service by ID
- `DELETE /api/services/:id` - Delete service

### Jobs
- `POST /api/jobs/hire` - Hire a service provider
- `GET /api/jobs/myjobs` - Get user's jobs
- `PUT /api/jobs/:id/status` - Update job status

### Payments
- `POST /api/payment/create-payment-intent` - Create Stripe payment

### Health
- `GET /health` - Health check endpoint

## 📄 License

MIT License
