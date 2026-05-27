# concurrency-consistency-lab

재고 차감 시나리오를 기반으로 동시 요청 환경에서 발생하는 데이터 정합성 문제를 재현하고,  
Spring Boot/JPA와 FastAPI에서의 해결 방식을 비교한 포트폴리오 프로젝트입니다.

## Docker Compose 통합 실행

루트에서 아래 명령으로 전체 스택을 실행합니다.

```bash
docker compose up --build -d
```

## 개발용 인프라만 실행 (MySQL + Redis)

로컬에서 프론트/백엔드를 직접 실행할 때, 개발 편의를 위해 DB/Redis 컨테이너만 올릴 수 있습니다.
이 방식은 **개발 환경에서만 적용**합니다.

```bash
docker compose up -d mysql redis
```

개발용 compose 파일을 사용하는 경우:

```bash
docker compose -f docker-compose.dev.yml up -d mysql redis
```

구성:

- `frontend`: Next.js (`http://localhost:5005`)
- `project-spring (Spring Ver)`: Spring LB (`http://localhost:5010`) -> `backend-spring-1`, `backend-spring-2`
- `project-fastapi (FastAPI Ver)`: FastAPI LB (`http://localhost:5020`) -> `backend-fastapi-1`, `backend-fastapi-2`
- `mysql`: MySQL 8 (`localhost:13306`, 데이터 디렉터리 `./db/mysql`)
- `redis`: Redis (`localhost:16379`, 데이터 디렉터리 `./db/redis`)

MySQL은 최초 초기화 시 `./docker/mysql/init` 아래 SQL을 실행합니다.
`001_create_products.sql`로 테이블을 생성하고, `002_seed_products.sql`로 샘플 상품 20건(랜덤 재고)을 입력합니다.
이미 생성된 `./db/mysql` 볼륨이 있으면 초기화 SQL은 다시 실행되지 않습니다.

상태 확인:

```bash
docker compose ps
```

종료:

```bash
docker compose down
```
