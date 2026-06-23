-- CreateIndex
CREATE INDEX "idx_orderitem_menuitem" ON "order_items"("menu_item_id");

-- CreateIndex
CREATE INDEX "idx_user_restaurant" ON "users"("restaurant_id");
