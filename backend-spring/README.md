# backend-spring

## Requirements

- JDK 25 (latest LTS)
- Gradle 9+ (or Maven if you convert the build)

## Run

```bash
gradle bootRun
```

Server starts on `http://localhost:5010`.

## Endpoints

- `GET /`
- `GET /health`
- `POST /api/products`
- `GET /api/products/{productId}`
- `GET /api/products/api-id/{apiId}`
- `POST /api/products/{productId}/decrease`
- `DELETE /api/products/{productId}`

### Request Examples

Create product:

```json
{
  "apiId": "SKU-1001",
  "name": "Sample Product",
  "stock": 100
}
```

Decrease stock:

```json
{
  "qty": 1
}
```
