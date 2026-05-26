# concurrency-consistency-lab

재고 차감 시나리오를 기반으로 동시 요청 환경에서 발생하는 데이터 정합성 문제를 재현하고,  
Spring Boot/JPA와 FastAPI에서의 해결 방식을 비교한 포트폴리오 프로젝트입니다.

## Docker Compose 통합 실행

루트에서 아래 명령으로 전체 스택을 실행합니다.

```bash
docker compose up --build -d
```

개발 모드(핫리로드) 실행:

```bash
docker compose -f docker-compose.dev.yml up -d
```

구성:

- `frontend`: Next.js (`http://localhost:5005`)
- `project-spring`: Spring LB (`http://localhost:5010`) -> `backend-spring-1`, `backend-spring-2`
- `project-fastapi`: FastAPI LB (`http://localhost:5020`) -> `backend-fastapi-1`, `backend-fastapi-2`
- `mysql`: MySQL 8 (`localhost:3306`, 데이터 디렉터리 `./db/mysql`)
- `redis`: Redis (`localhost:6379`, 데이터 디렉터리 `./db/redis`)

상태 확인:

```bash
docker compose ps
```

종료:

```bash
docker compose down
```
