# Database Design

## users

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| name       | VARCHAR   |
| mobile     | VARCHAR   |
| email      | VARCHAR   |
| role       | ENUM      |
| status     | BOOLEAN   |
| created_at | TIMESTAMP |

---

## restaurants

| Field        | Type    |
| ------------ | ------- |
| id           | UUID    |
| name         | VARCHAR |
| description  | TEXT    |
| address      | TEXT    |
| latitude     | DECIMAL |
| longitude    | DECIMAL |
| phone        | VARCHAR |
| status       | BOOLEAN |
| opening_time | TIME    |
| closing_time | TIME    |

---

## restaurant_users

| Field         | Type    |
| ------------- | ------- |
| id            | UUID    |
| restaurant_id | UUID    |
| name          | VARCHAR |
| email         | VARCHAR |
| password      | VARCHAR |
| role          | VARCHAR |

---

## categories

| Field         | Type    |
| ------------- | ------- |
| id            | UUID    |
| restaurant_id | UUID    |
| name          | VARCHAR |
| status        | BOOLEAN |

---

## menu_items

| Field         | Type    |
| ------------- | ------- |
| id            | UUID    |
| restaurant_id | UUID    |
| category_id   | UUID    |
| name          | VARCHAR |
| description   | TEXT    |
| price         | DECIMAL |
| image_url     | TEXT    |
| is_available  | BOOLEAN |

---

## carts

| Field         | Type |
| ------------- | ---- |
| id            | UUID |
| user_id       | UUID |
| restaurant_id | UUID |

---

## cart_items

| Field        | Type    |
| ------------ | ------- |
| id           | UUID    |
| cart_id      | UUID    |
| menu_item_id | UUID    |
| quantity     | INTEGER |

---

## orders

| Field          | Type      |
| -------------- | --------- |
| id             | UUID      |
| order_number   | VARCHAR   |
| user_id        | UUID      |
| restaurant_id  | UUID      |
| total_amount   | DECIMAL   |
| payment_status | VARCHAR   |
| order_status   | VARCHAR   |
| pickup_time    | TIMESTAMP |
| qr_code        | TEXT      |
| created_at     | TIMESTAMP |

---

## order_items

| Field        | Type    |
| ------------ | ------- |
| id           | UUID    |
| order_id     | UUID    |
| menu_item_id | UUID    |
| price        | DECIMAL |
| quantity     | INTEGER |

---

## payments

| Field          | Type    |
| -------------- | ------- |
| id             | UUID    |
| order_id       | UUID    |
| gateway        | VARCHAR |
| transaction_id | VARCHAR |
| amount         | DECIMAL |
| status         | VARCHAR |

---

## notifications

| Field   | Type    |
| ------- | ------- |
| id      | UUID    |
| user_id | UUID    |
| title   | VARCHAR |
| message | TEXT    |
| is_read | BOOLEAN |

---

## reviews

| Field         | Type    |
| ------------- | ------- |
| id            | UUID    |
| user_id       | UUID    |
| restaurant_id | UUID    |
| rating        | INTEGER |
| review        | TEXT    |
