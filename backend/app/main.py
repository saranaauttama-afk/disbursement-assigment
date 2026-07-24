from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import requests

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Disbursement System API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(requests.router)


@app.get("/health")
def health():
    return {"status": "ok"}
