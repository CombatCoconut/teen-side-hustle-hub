# Teen Side Hustle Hub

A safe, secure marketplace platform connecting teenagers (13-18) with local job opportunities from homeowners, parents, and small businesses.

## Features

### For Teens
- Create professional profiles with skills and services
- Set availability and service areas
- Browse and apply for local jobs
- Built-in messaging with customers
- Earnings dashboard and payment tracking
- Achievement system for gamification
- Parent approval workflows for safety

### For Customers
- Search and filter local teen workers
- Post job listings
- Message workers directly
- Leave reviews and ratings
- Secure payment processing
- Verified worker profiles

### Safety & Trust
- Parent-linked accounts for minors
- Optional identity verification
- Safe meet guidelines
- Location sharing
- Message monitoring
- Review system with verified badges

## Tech Stack

- **Frontend:** React 18 + TypeScript + Tailwind CSS + Redux
- **Backend:** Node.js + Express + PostgreSQL
- **Real-time:** Socket.io for messaging
- **Authentication:** JWT + OAuth
- **Payments:** Stripe API
- **Deployment:** Docker + Docker Compose

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/CombatCoconut/teen-side-hustle-hub.git
cd teen-side-hustle-hub
```

2. **Setup environment variables**
```bash
cp .env.example .env
```

3. **Using Docker**
```bash
docker-compose up -d
```

4. **Manual Setup**

Backend:
```bash
cd backend
npm install
npm run db:migrate
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm start
```

## Project Structure

```
teen-side-hustle-hub/
├── frontend/              # React app
├── backend/               # Express server
├── database/              # Database migrations
├── docker-compose.yml
├── .env.example
└── README.md
```

## License

MIT License
