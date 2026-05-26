from fastapi import FastAPI

app = FastAPI(title="backend-fastapi")


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "backend-fastapi is running"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
