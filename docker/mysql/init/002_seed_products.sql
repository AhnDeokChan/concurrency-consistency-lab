INSERT INTO products (api_id, name, stock, deleted_at, created_at, updated_at)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1
  FROM seq
  WHERE n < 20
)
SELECT
  CONCAT('sample-product-', LPAD(n, 3, '0')) AS api_id,
  CONCAT('Sample Product ', LPAD(n, 2, '0')) AS name,
  FLOOR(50 + (RAND() * 451)) AS stock,
  NULL AS deleted_at,
  CURRENT_TIMESTAMP(6) AS created_at,
  CURRENT_TIMESTAMP(6) AS updated_at
FROM seq
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  stock = VALUES(stock),
  deleted_at = NULL,
  updated_at = CURRENT_TIMESTAMP(6);
