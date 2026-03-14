from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from app.config import settings

# SQLite: single-writer; avoid pool so we don't hold multiple connections and hit "database is locked"
connect_args = {}
engine_kw: dict = {"echo": False}
if "sqlite" in settings.database_url:
    connect_args["timeout"] = 30
    engine_kw["connect_args"] = connect_args
    engine_kw["poolclass"] = NullPool  # new connection per request, no pool

engine = create_async_engine(settings.database_url, **engine_kw)

if "sqlite" in settings.database_url:
    @event.listens_for(engine.sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=30000")  # 30s in ms
        cursor.close()

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    from pathlib import Path
    from app import models  # noqa: F401 — register all models with Base.metadata
    # Ensure DB directory exists (e.g. ./data for Docker)
    db_url = settings.database_url
    if "sqlite" in db_url:
        try:
            path = db_url.split("///")[-1].split("?")[0]
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        except Exception:
            pass
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
