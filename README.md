# Multi-Vendor Order Management System

A Node.js backend for a multi-vendor order management system where vendors can manage products, customers can place orders across multiple vendors, and the system automatically splits orders per vendor.

## Features

- **Authentication & RBAC**
  - JWT-based authentication
  - Role-based access control: Customer, Vendor, Admin

- **Product Management**
  - Vendors can create, update, and delete their products
  - Product fields: name, price, stock, category

- **Order Management**
  - Customers can place orders with items from multiple vendors
  - Orders are automatically split per vendor
  - Stock validation and transaction-safe stock updates

- **Analytics**
  - Admin: Revenue per vendor, top products, average order value
  - Vendor: Daily sales, low-stock items

## System Workflow Diagram

```mermaid
flowchart TD
    subgraph Authentication
        Register[Register User]
        Login[Login User]
        Token[JWT Token]
        Register --> Login
        Login --> Token
    end

    subgraph Vendor
        VP[Vendor Portal]
        PM[Product Management]
        VS[View Sales]
        OFV[Order Fulfillment]
        LSI[Low Stock Items]
        Token --> VP
        VP --> PM
        VP --> VS
        VP --> OFV
        VP --> LSI
        PM --> CreateProduct[Create Product]
        PM --> UpdateProduct[Update Product]
        PM --> DeleteProduct[Delete Product]
        OFV --> UpdateStatus[Update Order Status]
    end

    subgraph Customer
        CP[Customer Portal]
        Browse[Browse Products]
        Cart[Add to Cart]
        Checkout[Checkout]
        VO[View Orders]
        Token --> CP
        CP --> Browse
        Browse --> Cart
        Cart --> Checkout
        CP --> VO
    end

    subgraph Admin
        AP[Admin Portal]
        Analytics[Analytics Dashboard]
        VR[Vendor Revenue]
        TP[Top Products]
        AOV[Average Order Value]
        Token --> AP
        AP --> Analytics
        Analytics --> VR
        Analytics --> TP
        Analytics --> AOV
    end

    subgraph OrderProcessing
        Checkout --> ValidateOrder[Validate Stock]
        ValidateOrder --> SplitOrder[Split Order by Vendor]
        SplitOrder --> ProcessPayment[Process Payment]
        ProcessPayment --> CreateOrder[Create Master Order]
        CreateOrder --> CreateSubOrders[Create Vendor Sub-Orders]
        CreateSubOrders --> UpdateStock[Update Product Stock]
        CreateSubOrders --> NotifyVendors[Notify Vendors]
    end

    UpdateStatus --> NotifyCustomer[Notify Customer]
```
    
## Customer Sequence Diagram - Order Placement Flow

```mermaid
sequenceDiagram
    actor Customer
    participant API as API Server
    participant Auth as Auth Middleware
    participant Trans as Transaction Handler
    participant DB as Database

    Customer->>API: POST /api/orders with items
    API->>Auth: Verify JWT & Check Role
    Auth->>API: User Authenticated as Customer

    API->>Trans: Begin Transaction
    
    Trans->>DB: Fetch Products Info
    DB->>Trans: Return Products Details
    
    Trans->>Trans: Validate Stock Availability
    Trans->>Trans: Calculate Order Totals
    Trans->>Trans: Group Items by Vendor
    
    Trans->>DB: Create Master Order
    DB->>Trans: Return Order ID
    
    loop For Each Vendor
        Trans->>DB: Create Vendor Order
        DB->>Trans: Return Vendor Order ID
        
        loop For Each Product from Vendor
            Trans->>DB: Create Order Item
            Trans->>DB: Update Product Stock
        end
    end
    
    Trans->>DB: Commit Transaction
    DB->>Trans: Transaction Committed
    
    Trans->>API: Return Order Details
    API->>Customer: Order Confirmation with Split Orders
```


## Tech Stack

- Node.js & Express
- Prisma ORM with PostgreSQL
- JWT for authentication
- Bcrypt for password hashing
- Joi for validation

## Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd multi-vendor-order-management
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   # Update DATABASE_URL in .env with your PostgreSQL connection string example is given in .env.example
   # Refer .env.example file to add more secret info required to run this project
   ```

4. Run database migrations
   ```bash
   npx prisma migrate dev
   ```

5. Generate Prisma Client
   ```bash
   npx prisma generate
   ```

6. Start the development server
   ```bash
   npm run dev
   ```

## API Documentation

### Authentication

- **POST /api/auth/register** - Register a new user
- **POST /api/auth/login** - Login and get JWT token
- **GET /api/auth/profile** - Get user profile

### Products

- **GET /api/products** - Get all products
- **GET /api/products/:id** - Get product by ID
- **GET /api/products/vendor/my-products** - Get vendor's products
- **POST /api/products** - Create a new product (Vendor)
- **PUT /api/products/:id** - Update a product (Vendor)
- **DELETE /api/products/:id** - Delete a product (Vendor)

### Orders

- **POST /api/orders** - Create a new order (Customer)
- **GET /api/orders/customer/my-orders** - Get customer's orders
- **GET /api/orders/vendor/my-orders** - Get vendor's orders
- **GET /api/orders/:id** - Get order details
- **PATCH /api/orders/vendor/:id/status** - Update vendor order status

### Analytics

- **GET /api/analytics/admin/vendor-revenue** - Get revenue per vendor (Admin)
- **GET /api/analytics/admin/top-products** - Get top 5 products by sales (Admin)
- **GET /api/analytics/admin/average-order-value** - Get average order value (Admin)
- **GET /api/analytics/vendor/daily-sales** - Get vendor's daily sales (Vendor)
- **GET /api/analytics/vendor/low-stock** - Get vendor's low stock items (Vendor) 
