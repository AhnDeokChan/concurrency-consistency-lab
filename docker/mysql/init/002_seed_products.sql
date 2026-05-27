INSERT INTO products (api_id, name, stock, deleted_at, created_at, updated_at)
VALUES
  ('sample-product-001', 'Sample Product A', 100, NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
  ('sample-product-002', 'Sample Product B', 200, NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
  ('sample-product-003', 'Sample Product C', 300, NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)) AS new
ON DUPLICATE KEY UPDATE
  name = new.name,
  stock = new.stock,
  deleted_at = NULL,
  updated_at = CURRENT_TIMESTAMP(6);
