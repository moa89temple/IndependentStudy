"""
Clear all data from the Lizard database.
Run from the backend directory: python scripts/clear_db.py
(Stop the uvicorn server first if you get "database is locked".)
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path so app is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.config import settings
from app.database import engine


# Order: respect FKs (children before parents)
TABLES = [
    "interactions",
    "practice_questions",
    "flashcards",
    "concepts",
    "text_chunks",
    "materials",
    "courses",
]


async def clear():
    async with engine.begin() as conn:
        for table in TABLES:
            await conn.execute(text(f"DELETE FROM {table}"))
    print("Database cleared.")


if __name__ == "__main__":
    asyncio.run(clear())
