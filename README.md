# 🍽️ FoodHub Pro

A production-grade multi-vendor food delivery platform built with **Java 21**, **Spring Boot**, **MySQL**, **Redis**, **React**, and **Docker**.

---

## 🏗️ Architecture

```
React Frontend
      │
   Nginx (port 80)
      │
Spring Boot Backend (port 8080)
      │
 ─────────────────────────────────
  auth/       → JWT + Refresh Token
  restaurant/ → Multi-vendor onboarding
  menu/       → Menu management
  order/      → State machine lifecycle
  delivery/   → GPS tracking (WebSocket)
  review/     → Ratings & reviews
  notification/ → Email + SMS
  analytics/  → Admin dashboard
  common/     → Security, exceptions, config
 ─────────────────────────────────
      │
   MySQL 8   Redis 7
```

---

## 🚀 Quick Start

### 1. Clone & configure
```bash
git clone https://github.com/your-username/foodhub-pro.git
cd foodhub-pro
```

### 2. Set secrets in `.env` (copy from below)
```env
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your_app_password
```

### 3. Run with Docker
```bash
docker-compose up --build
```

### 4. Access
| Service | URL |
|---|---|
| API | http://localhost:8080/api |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| Via Nginx | http://localhost |

---

## 🔑 Default Users

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `Admin@123` |
| Customer | `customer1` | `Customer@123` |
| Restaurant Owner | `owner1` | `Owner@123` |
| Delivery Partner | `delivery1` | `Delivery@123` |

---

## 📡 Key API Endpoints

### Auth
```
POST /api/auth/register     → Register (role: customer/restaurant_owner/delivery_partner)
POST /api/auth/login        → Login → returns accessToken + refreshToken
POST /api/auth/refresh      → Rotate refresh token
POST /api/auth/logout       → Invalidate refresh token
```

### Restaurants (public)
```
GET  /api/restaurants?city=Mumbai&storeType=RESTAURANT&search=pizza
GET  /api/restaurants/{id}
GET  /api/restaurants/{id}/menu
GET  /api/restaurants/{id}/reviews
```

### Owner
```
POST   /api/owner/restaurants           → Register restaurant
PUT    /api/owner/restaurants/{id}      → Update
DELETE /api/owner/restaurants/{id}      → Soft delete
POST   /api/owner/restaurants/{id}/menu → Add menu item
PUT    /api/owner/menu/{itemId}         → Update item
DELETE /api/owner/menu/{itemId}         → Delete item
GET    /api/orders/restaurant/{id}      → View incoming orders
PATCH  /api/orders/{id}/status?status=CONFIRMED
```

### Customer
```
POST /api/orders                        → Place order
GET  /api/orders/my                     → Order history
POST /api/restaurants/{id}/reviews      → Rate restaurant
```

### Admin
```
PATCH /api/admin/restaurants/{id}/approve
PATCH /api/admin/restaurants/{id}/reject
GET   /api/admin/analytics/dashboard
```

### WebSocket
```
CONNECT  ws://localhost:8080/ws
SUBSCRIBE /topic/order/{orderId}/status    → Order status updates
SUBSCRIBE /topic/order/{orderId}/location  → GPS tracking
SUBSCRIBE /topic/restaurant/{id}/orders   → New orders (owner)
SEND     /app/delivery/location            → Partner sends GPS
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.2 |
| Auth | JWT + Refresh Token rotation |
| Database | MySQL 8 |
| Cache | Redis 7 |
| Real-time | WebSocket (STOMP) |
| SMS | Twilio |
| Email | Spring Mail (Gmail SMTP) |
| Payment | Razorpay |
| PDF | iText |
| QR Code | ZXing |
| File Storage | AWS S3 |
| API Docs | Swagger / OpenAPI 3 |
| Testing | JUnit 5 + Testcontainers |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions → EC2 |
| Proxy | Nginx |

---

## 🔄 Order State Machine

```
PLACED → CONFIRMED → PREPARING → READY_FOR_PICKUP → PICKED_UP → DELIVERED
       ↘ REJECTED   ↘ CANCELLED
```

---

## 📁 Project Structure

```
foodhub-pro/
├── backend/
│   └── src/main/java/com/foodhub/
│       ├── auth/           JWT, refresh token, roles
│       ├── restaurant/     Multi-vendor (RESTAURANT/GROCERY/PHARMACY)
│       ├── menu/           Menu items per restaurant
│       ├── order/          Order lifecycle + state machine
│       ├── delivery/       GPS tracking via WebSocket
│       ├── review/         Ratings + auto-update avg
│       ├── notification/   Email + SMS (async)
│       ├── analytics/      Admin dashboard stats
│       └── common/         Security, exceptions, Swagger
├── frontend/               React + Tailwind (Phase 2)
├── nginx/nginx.conf
├── docker-compose.yml
└── .github/workflows/deploy.yml
```

---

## 👨‍💻 Author
Built as a portfolio project demonstrating enterprise Java full-stack development.
