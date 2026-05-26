import os
from fastapi import FastAPI

app = FastAPI(title="backend-fastapi")


@app.get("/")
def read_root() -> dict[str, str]:
    return {
        "message": "backend-fastapi is running",
        "instance": os.getenv("INSTANCE_ID", "fastapi-unknown"),
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "instance": os.getenv("INSTANCE_ID", "fastapi-unknown"),
    }
