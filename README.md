
# ✨ SkillShare Local ✨

### *Your Neighborhood's Skill Marketplace*

[](https://nextjs.org/) [](https://nodejs.org/) [](https://www.mongodb.com/) [](https://stripe.com/)

In busy cities like Delhi, it's hard to find trusted help for small jobs, while many talented locals lack a simple way to offer their skills. **SkillShare Local** is a hyperlocal platform that fixes this. We connect neighbors to share skills and services, all backed by a secure, cashless payment system to build a stronger, more self-reliant community.

## Key Features

  * **Hyperlocal Search:** Instantly finds skilled providers within your immediate area using geospatial queries.
  * **End-to-End Booking:** Full job lifecycle from hiring a provider to a provider accepting on their dashboard.
  * **Secure Cashless Payments:** Integrated Stripe payments for safe and reliable transactions.
  * **Unified "My Jobs" Dashboard:** A single place for users to manage tasks as both a client and a provider.
  * **Dynamic UI:** A modern, responsive interface that intelligently displays options based on login status.

-----

## Tech Stack

  * **Backend:** Node.js, Express, MongoDB with Mongoose, JWT for authentication.
  * **Frontend:** Next.js, React, TypeScript, CSS Modules.
  * **Payments:** Stripe API with Webhooks for reliable payment confirmation.

-----

## 🔧 Challenges & Solutions

  * **Challenge:** Building a fast, location-based search.

      * **Solution:** We used MongoDB's native `2dsphere` geospatial indexing, allowing for highly efficient queries to find providers in a given radius.

  * **Challenge:** Guaranteeing payment confirmation is secure and reliable.

      * **Solution:** We built our system around **Stripe Webhooks**. The backend listens for the `payment_intent.succeeded` event directly from Stripe's servers, ensuring the database is updated only after payment is 100% confirmed.

  * **Challenge:** Creating a dashboard that works for two different user roles (client and provider).

      * **Solution:** The frontend decodes the user's JWT to get their ID and uses **conditional rendering** to show the correct actions (e.g., "Accept Job" for a provider, "Pay Now" for a client).

-----

## ✨ Future Scope

  * In-app chat between users.
  * A provider review and rating system.
  * Admin-driven provider verification badges.
  * Push notifications for job status updates.

-----

## 🚀 Getting Started (Local Setup)

### Prerequisites

  * Node.js (v18 or newer)
  * Git
  * A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
  * A free [Stripe](https://stripe.com/) account

### Installation

1.  **Clone the Repositories:** Create a main project folder and clone both the frontend and backend repositories into it.

    ```bash
    mkdir SkillShare-Project
    cd SkillShare-Project
    git clone https://github.com/your-username/skillshare-frontend.git
    git clone https://github.com/your-username/skillshare-backend.git
    ```

2.  **Setup the Backend:**

      * Navigate into the backend directory: `cd skillshare-backend`
      * Create a `.env` file and fill it with your keys (see template below).
      * Install dependencies: `npm install`

3.  **Setup the Frontend:**

      * Navigate into the frontend directory: `cd ../skillshare-frontend`
      * Create a `.env.local` file and add your Stripe Publishable Key.
      * Install dependencies: `npm install`

### Running the Application

You'll need two separate terminals.

  * **Terminal 1 (Backend):**

    ```bash
    # In the /skillshare-backend folder
    node server.js
    ```

    *Running at `http://localhost:5000`*

  * **Terminal 2 (Frontend):**

    ```bash
    # In the /skillshare-frontend folder
    npm run dev
    ```

    *Running at `http://localhost:3000`*

-----

## ⚙️ Environment Variables

**Never commit your `.env` files to Git\!**

#### Backend (`skillshare-backend/.env`)

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

team mwmbera
shivam 
yashika chaudhary
shikha sharma
deepak kumar

#### Frontend (`skillshare-frontend/.env.local`)

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```
