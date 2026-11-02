# ALBAB – عالباب

**ALBAB** is a web-based service marketplace platform designed to connect customers with service providers in Jordan.

The platform allows customers to browse available services, place orders, and track their orders. Service providers can manage their services and handle customer orders.

## Features

- User registration and login.
- Secure authentication using JWT.
- Browse available services.
- Place service orders.
- View personal orders and order details.
- Manage service listings.
- Order status management.
- Role-based access control.

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)

### Frontend
- React.js
- Vite
- JavaScript (ES6+)
- CSS

### Tools
- Git and GitHub
- Postman
- Visual Studio Code

## Project Structure

```text
ALBAB/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middeleware/
│   ├── server.js
│   ├── db.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   └── package.json
│
└── README.md
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/TareqMalkawi88/ALBAB.git
cd ALBAB
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the backend:

```bash
node server.js
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## API Endpoints

### Users

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/register` | Register a new user |
| POST | `/api/users/login` | Login |
| GET | `/api/users/profile` | Get authenticated user profile |

### Services

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/services` | Get all services |
| POST | `/api/services` | Create a service |
| PUT | `/api/services/:id` | Update a service |
| DELETE | `/api/services/:id` | Delete a service |

### Orders

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/orders` | Place a new order |
| GET | `/api/orders/my-orders` | Get user orders |
| PATCH | `/api/orders/:id/status` | Update order status |

Protected endpoints require a valid JWT token in the Authorization header:

```text
Authorization: Bearer YOUR_TOKEN
```

## User Roles

- **Customer:** Browse services, place orders, and view personal orders.
- **Provider:** Manage services and handle assigned orders.
- **Admin:** Manage platform operations with administrative permissions.

## Project Goal

ALBAB aims to make accessing everyday services easier by connecting customers with service providers through one convenient platform.

---

**Developed as a MERN Stack Final Project – DOT Jordan.**