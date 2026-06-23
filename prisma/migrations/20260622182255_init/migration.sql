-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'KITCHEN_STAFF');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'BILL_REQUESTED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'BILL_REQUESTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "WaiterCallStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "BillRequestStatus" AS ENUM ('PENDING', 'BILL_GENERATED', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "restaurant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "address" TEXT,
    "gst_number" TEXT,
    "tax_rate" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "qr_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "image" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dining_sessions" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "table_id" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "customer_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dining_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "order_number" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "total_amount" DOUBLE PRECISION NOT NULL,
    "special_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "bill_number" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax_rate" DOUBLE PRECISION NOT NULL,
    "tax_amount" DOUBLE PRECISION NOT NULL,
    "grand_total" DOUBLE PRECISION NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_items" (
    "id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waiter_calls" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "table_id" TEXT NOT NULL,
    "status" "WaiterCallStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waiter_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_requests" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "status" "BillRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_slug_key" ON "restaurants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_owner_id_key" ON "restaurants"("owner_id");

-- CreateIndex
CREATE INDEX "idx_table_restaurant" ON "tables"("restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tables_restaurant_id_number_key" ON "tables"("restaurant_id", "number");

-- CreateIndex
CREATE INDEX "idx_category_restaurant_sort" ON "categories"("restaurant_id", "sort_order");

-- CreateIndex
CREATE INDEX "idx_menuitem_restaurant_category" ON "menu_items"("restaurant_id", "category_id", "is_available");

-- CreateIndex
CREATE INDEX "idx_menuitem_soft_delete" ON "menu_items"("restaurant_id", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "dining_sessions_customer_token_key" ON "dining_sessions"("customer_token");

-- CreateIndex
CREATE INDEX "idx_session_table_status" ON "dining_sessions"("table_id", "status");

-- CreateIndex
CREATE INDEX "idx_session_restaurant_status" ON "dining_sessions"("restaurant_id", "status");

-- CreateIndex
CREATE INDEX "idx_order_restaurant_status_time" ON "orders"("restaurant_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "idx_order_session" ON "orders"("session_id");

-- CreateIndex
CREATE INDEX "idx_order_restaurant_date" ON "orders"("restaurant_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_orderitem_order" ON "order_items"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "bills_session_id_key" ON "bills"("session_id");

-- CreateIndex
CREATE INDEX "idx_bill_restaurant_payment" ON "bills"("restaurant_id", "payment_status");

-- CreateIndex
CREATE INDEX "idx_bill_restaurant_number" ON "bills"("restaurant_id", "bill_number");

-- CreateIndex
CREATE INDEX "idx_billitem_bill" ON "bill_items"("bill_id");

-- CreateIndex
CREATE INDEX "idx_waitercall_restaurant_status" ON "waiter_calls"("restaurant_id", "status");

-- CreateIndex
CREATE INDEX "idx_waitercall_table_time" ON "waiter_calls"("table_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_billrequest_restaurant_status" ON "bill_requests"("restaurant_id", "status");

-- CreateIndex
CREATE INDEX "idx_billrequest_session" ON "bill_requests"("session_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dining_sessions" ADD CONSTRAINT "dining_sessions_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dining_sessions" ADD CONSTRAINT "dining_sessions_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "dining_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "dining_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiter_calls" ADD CONSTRAINT "waiter_calls_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_requests" ADD CONSTRAINT "bill_requests_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "dining_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
