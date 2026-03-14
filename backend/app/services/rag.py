"""RAG: embed text chunks, store in Redis, retrieve by semantic similarity."""
import json

import numpy as np
from redis.asyncio import Redis

from app.config import settings

REDIS_PREFIX = "lizard"
CHUNK_KEY = f"{REDIS_PREFIX}:chunk"
COURSE_CHUNKS_SET = f"{REDIS_PREFIX}:course_chunks"
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536


def _get_redis() -> Redis:
    return Redis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
    )


async def get_embedding(text: str) -> list[float]:
    """Return embedding vector for text using OpenAI."""
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY not set")
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    # API expects string; truncate to ~8k tokens
    text = (text or "")[:30000].strip() or " "
    r = await client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text,
    )
    return r.data[0].embedding


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    a = np.asarray(a, dtype=np.float64)
    b = np.asarray(b, dtype=np.float64)
    n = np.linalg.norm(a) * np.linalg.norm(b)
    if n == 0:
        return 0.0
    return float(np.dot(a, b) / n)


async def store_chunk(
    redis: Redis,
    *,
    chunk_id: int,
    course_id: int,
    material_id: int,
    material_title: str,
    content: str,
    page_or_slide: int | None,
) -> None:
    """Embed chunk and store in Redis; add chunk_id to course set."""
    embedding = await get_embedding(content[:8000])
    payload = {
        "chunk_id": chunk_id,
        "course_id": course_id,
        "material_id": material_id,
        "material_title": material_title,
        "content": content[:12000],
        "page_or_slide": page_or_slide,
        "embedding": embedding,
    }
    key = f"{CHUNK_KEY}:{chunk_id}"
    await redis.set(key, json.dumps(payload), ex=60 * 60 * 24 * 30)  # 30 days TTL
    await redis.sadd(f"{COURSE_CHUNKS_SET}:{course_id}", chunk_id)


async def ensure_course_chunks_in_redis(
    redis: Redis,
    chunks: list[tuple[int, int, str, str, str, int | None]],
) -> None:
    """
    chunks: list of (chunk_id, course_id, material_id, material_title, content, page_or_slide).
    Only stores chunks that are not already in Redis.
    """
    for chunk_id, course_id, material_id, material_title, content, page_or_slide in chunks:
        key = f"{CHUNK_KEY}:{chunk_id}"
        if await redis.exists(key):
            continue
        await store_chunk(
            redis,
            chunk_id=chunk_id,
            course_id=course_id,
            material_id=material_id,
            material_title=material_title,
            content=content,
            page_or_slide=page_or_slide,
        )


async def get_relevant_chunks(
    redis: Redis,
    course_id: int,
    query: str,
    top_k: int = 10,
) -> list[dict]:
    """
    Return top_k chunks most similar to query text.
    Each dict has: chunk_id, course_id, material_id, material_title, content, page_or_slide.
    """
    member_ids = await redis.smembers(f"{COURSE_CHUNKS_SET}:{course_id}")
    if not member_ids:
        return []
    query_embedding = await get_embedding(query)
    query_vec = np.array(query_embedding, dtype=np.float64)
    scored: list[tuple[float, dict]] = []
    for cid_str in member_ids:
        try:
            cid = int(cid_str)
        except (ValueError, TypeError):
            continue
        key = f"{CHUNK_KEY}:{cid}"
        raw = await redis.get(key)
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        emb = data.get("embedding")
        if not emb or len(emb) != EMBEDDING_DIM:
            continue
        sim = _cosine_similarity(query_vec, np.array(emb, dtype=np.float64))
        scored.append((sim, {
            "chunk_id": data.get("chunk_id", cid),
            "course_id": data.get("course_id"),
            "material_id": data.get("material_id"),
            "material_title": data.get("material_title", ""),
            "content": data.get("content", ""),
            "page_or_slide": data.get("page_or_slide"),
        }))
    scored.sort(key=lambda x: -x[0])
    return [s[1] for s in scored[:top_k]]
