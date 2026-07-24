import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine, SessionLocal
from .routers import notifications, requests
from .routers.auth import router as auth_router
from .routers.users import router as users_router
from .routers.config import router as config_router


def _seed() -> None:
    from .models import Role, SystemConfig, User, UserRole
    from .auth import hash_password

    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return

        def mk(name: str, email: str, pw: str, roles: list[str], mgr: str | None = None) -> User:
            u = User(
                id=str(uuid.uuid4()),
                name=name,
                email=email,
                password_hash=hash_password(pw),
                manager_id=mgr,
            )
            db.add(u)
            db.flush()
            for r in roles:
                db.add(UserRole(user_id=u.id, role=Role(r)))
            return u

        bob = mk("Bob", "bob@example.com", "password123", ["REQUESTER", "MANAGER"])
        alice = mk("Alice", "alice@example.com", "password123", ["REQUESTER"], mgr=bob.id)
        carol = mk("Carol", "carol@example.com", "password123", ["FINANCE"])
        dave = mk("Dave", "dave@example.com", "password123", ["ADMIN"])

        if not db.get(SystemConfig, "finance_approval_threshold_thb"):
            db.add(
                SystemConfig(
                    key="finance_approval_threshold_thb",
                    value="10000",
                    updated_by=dave.id,
                )
            )
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _seed()
    yield


app = FastAPI(title="Disbursement System API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(requests.router)
app.include_router(notifications.router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(config_router)


@app.get("/health")
def health():
    return {"status": "ok"}
