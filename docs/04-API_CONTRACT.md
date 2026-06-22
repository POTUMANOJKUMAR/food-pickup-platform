# API Contract Document

Base URL

/api/v1

---

AUTH APIs

POST /auth/send-otp

Request

{
"mobile":"9876543210"
}

POST /auth/verify-otp

Request

{
"mobile":"9876543210",
"otp":"123456"
}

---

RESTAURANT APIs

GET /restaurants

GET /restaurants/:id

GET /restaurants/:id/menu

---

CATEGORY APIs

GET /categories

POST /categories

PUT /categories/:id

DELETE /categories/:id

---

MENU APIs

GET /menu

POST /menu

PUT /menu/:id

DELETE /menu/:id

---

CART APIs

GET /cart

POST /cart/add

POST /cart/update

DELETE /cart/remove

---

ORDER APIs

POST /orders

GET /orders

GET /orders/:id

PUT /orders/:id/status

---

PAYMENT APIs

POST /payments/create-order

POST /payments/verify

GET /payments/history

---

NOTIFICATION APIs

GET /notifications

PUT /notifications/read

---

REVIEW APIs

POST /reviews

GET /reviews/:restaurantId

---

ADMIN APIs

GET /admin/dashboard

GET /admin/restaurants

PUT /admin/restaurants/:id/approve

GET /admin/users

GET /admin/orders

---

RESTAURANT PANEL APIs

GET /restaurant/orders

PUT /restaurant/orders/:id/accept

PUT /restaurant/orders/:id/preparing

PUT /restaurant/orders/:id/ready

PUT /restaurant/orders/:id/completed

---

Response Format

{
"success": true,
"message": "Success",
"data": {}
}

Error Format

{
"success": false,
"message": "Something went wrong"
}
