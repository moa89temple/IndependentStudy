"""Extract concepts and generate flashcards/questions/shorts via LLM + RAG."""
import asyncio
import json
from urllib import error as urlerror
from urllib import request as urlrequest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models import Course, Material, Concept, Flashcard, PracticeQuestion, ShortVideo
from app.prompts.extract import (
    FLASHCARD_PROMPT,
    PRACTICE_QUESTION_PROMPT,
    RAG_CONCEPT_EXTRACTION_PROMPT,
    SHORTS_TOPICS_PROMPT,
    SHORTS_DIALOGUE_PROMPT,
)
from app.services.rag import (
    _get_redis,
    ensure_course_chunks_in_redis,
    get_relevant_chunks,
)


async def _call_llm(system: str | None, user: str) -> str:
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY not set")
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": user})
    r = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.3,
    )
    return (r.choices[0].message.content or "").strip()


def _parse_json_list(raw: str) -> list[dict]:
    raw = raw.strip()
    start = raw.find("[")
    if start == -1:
        return []
    depth = 0
    end = -1
    for i in range(start, len(raw)):
        if raw[i] == "[":
            depth += 1
        elif raw[i] == "]":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end == -1:
        return []
    try:
        return json.loads(raw[start:end])
    except json.JSONDecodeError:
        return []


def _parse_single_json(raw: str) -> dict | None:
    raw = raw.strip()
    start = raw.find("{")
    if start == -1:
        return None
    depth = 0
    end = -1
    for i in range(start, len(raw)):
        if raw[i] == "{":
            depth += 1
        elif raw[i] == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end == -1:
        return None
    try:
        return json.loads(raw[start:end])
    except json.JSONDecodeError:
        return None


# RAG: max chunks to embed and store in Redis per course; max passages to send to LLM per run
MAX_CHUNKS_TO_EMBED = 30
RAG_TOP_K = 12
MAX_SHORTS_TOPICS = 8


def _parse_string_list(raw: str) -> list[str]:
    items = _parse_json_list(raw)
    if not isinstance(items, list):
        return []
    topics: list[str] = []
    for item in items:
        if not isinstance(item, str):
            continue
        topic = item.strip()
        if topic and topic.lower() not in {t.lower() for t in topics}:
            topics.append(topic[:120])
        if len(topics) >= MAX_SHORTS_TOPICS:
            break
    return topics


def _parse_dialogue_items(raw: str) -> list[dict]:
    arr = _parse_json_list(raw)
    if not isinstance(arr, list):
        return []
    cleaned: list[dict] = []
    for item in arr:
        if not isinstance(item, dict):
            continue
        dialogue = str(item.get("dialogue", "")).strip()[:300]
        character = str(item.get("character", "")).strip()
        image = str(item.get("image", "")).strip()
        image_search = str(item.get("image_search", "")).strip()[:120]
        if character not in {"Peter", "Stewie"}:
            continue
        if character == "Peter" and image != "peter.png":
            image = "peter.png"
        if character == "Stewie" and image != "stewie.png":
            image = "stewie.png"
        if not dialogue:
            continue
        cleaned.append({
            "dialogue": dialogue,
            "character": character,
            "image": image,
            "image_search": image_search,
            "audio_processed": 0,
            "audio_process_retry": 0,
        })
        if len(cleaned) >= 32:
            break
    return cleaned


def _post_generate_sync(dialogues: list[dict]) -> dict:
    url = f"{settings.shorts_api_base_url.rstrip('/')}/lizards/generate"
    payload = json.dumps(dialogues).encode("utf-8")
    req = urlrequest.Request(
        url,
        data=payload,
        method="POST",
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    with urlrequest.urlopen(req, timeout=45) as res:
        raw = res.read().decode("utf-8")
    return json.loads(raw)


def _get_job_sync(job_id: str) -> dict:
    url = f"{settings.shorts_api_base_url.rstrip('/')}/lizards/jobs/{job_id}"
    req = urlrequest.Request(url, method="GET")
    with urlrequest.urlopen(req, timeout=45) as res:
        raw = res.read().decode("utf-8")
    return json.loads(raw)


async def _create_short_video_for_topic(session: AsyncSession, course_id: int, topic: str) -> None:
    dialogue_prompt = SHORTS_DIALOGUE_PROMPT.format(topic=topic)
    dialogue_raw = await _call_llm(
        system="Output only valid JSON array of dialogue objects, no markdown.",
        user=dialogue_prompt,
    )
    dialogues = _parse_dialogue_items(dialogue_raw)
    if not dialogues:
        session.add(ShortVideo(
            course_id=course_id,
            topic=topic,
            job_id=f"local-{topic[:30]}",
            status="failed",
            error="LLM did not return a valid dialogue array for shorts generation.",
        ))
        return

    try:
        generate_response = await asyncio.to_thread(_post_generate_sync, dialogues)
        job_id = str(generate_response.get("job_id", "")).strip()
        status = str(generate_response.get("status", "queued")).strip() or "queued"
        status_url = generate_response.get("status_url")
        if not job_id:
            raise ValueError("Shorts API did not return job_id")
    except (urlerror.URLError, TimeoutError, json.JSONDecodeError, ValueError) as e:
        session.add(ShortVideo(
            course_id=course_id,
            topic=topic,
            job_id=f"local-{topic[:30]}",
            status="failed",
            error=f"Shorts create request failed: {e!s}",
        ))
        return

    video_url: str | None = None
    error_message: str | None = None
    for _ in range(settings.shorts_poll_max_attempts):
        await asyncio.sleep(max(1, settings.shorts_poll_interval_seconds))
        try:
            job = await asyncio.to_thread(_get_job_sync, job_id)
        except (urlerror.URLError, TimeoutError, json.JSONDecodeError):
            continue
        status = str(job.get("status", status)).strip() or status
        maybe_video_url = str(job.get("video_url", "")).strip()
        if maybe_video_url:
            video_url = maybe_video_url
        if status.lower() == "completed" and video_url:
            break
        if status.lower() in {"failed", "error", "cancelled"}:
            error_message = str(job.get("error", "")).strip() or "Shorts job failed."
            break

    if status.lower() != "completed" or not video_url:
        if not error_message:
            error_message = "Timed out waiting for shorts job completion."

    session.add(ShortVideo(
        course_id=course_id,
        topic=topic,
        job_id=job_id,
        status=status,
        status_url=status_url,
        video_url=video_url,
        error=error_message,
    ))


async def _add_flashcard_and_question(
    session: AsyncSession,
    concept: Concept,
    concept_name: str,
    explanation: str,
    source_span: str | None,
) -> None:
    """Generate one flashcard and one practice question for a concept."""
    fc_prompt = FLASHCARD_PROMPT.format(concept_name=concept_name, explanation=explanation[:2000])
    fc_resp = await _call_llm(
        system="You output only valid JSON with keys front and back.",
        user=fc_prompt,
    )
    fc_obj = _parse_single_json(fc_resp)
    if fc_obj and fc_obj.get("front") and fc_obj.get("back"):
        session.add(Flashcard(
            concept_id=concept.id,
            front=fc_obj["front"][:2000],
            back=fc_obj["back"][:2000],
        ))
    q_prompt = PRACTICE_QUESTION_PROMPT.format(concept_name=concept_name, explanation=explanation[:2000])
    q_resp = await _call_llm(
        system="You output only valid JSON with keys question and expected_answer.",
        user=q_prompt,
    )
    q_obj = _parse_single_json(q_resp)
    if q_obj and q_obj.get("question") and q_obj.get("expected_answer"):
        session.add(PracticeQuestion(
            concept_id=concept.id,
            question=q_obj["question"][:2000],
            expected_answer=q_obj["expected_answer"][:2000],
            source_ref=source_span,
        ))


async def run_extraction(session: AsyncSession, course_id: int) -> None:
    """RAG only: embed chunks in Redis, retrieve by similarity, extract concepts and generate study materials."""
    result = await session.execute(
        select(Course).where(Course.id == course_id).options(
            selectinload(Course.materials).selectinload(Material.chunks),
        )
    )
    course = result.scalar_one_or_none()
    if not course:
        raise ValueError("Course not found")

    chunks_for_redis: list[tuple] = []  # (chunk_id, course_id, material_id, material_title, content, page_or_slide)
    for material in course.materials:
        if len(chunks_for_redis) >= MAX_CHUNKS_TO_EMBED:
            break
        for chunk in material.chunks:
            if len(chunks_for_redis) < MAX_CHUNKS_TO_EMBED:
                chunks_for_redis.append((
                    chunk.id,
                    course_id,
                    material.id,
                    material.title,
                    chunk.content[:8000],
                    chunk.page_or_slide,
                ))
        if len(chunks_for_redis) >= MAX_CHUNKS_TO_EMBED:
            break

    if not chunks_for_redis:
        raise ValueError("No materials or chunks to process. Upload at least one file first.")

    redis = _get_redis()
    try:
        await ensure_course_chunks_in_redis(redis, chunks_for_redis)
        relevant = await get_relevant_chunks(
            redis,
            course_id,
            "key concepts definitions and explanations from course material",
            top_k=RAG_TOP_K,
        )
    except Exception as e:
        await redis.aclose()
        raise ValueError(f"Redis is required for processing. Start Redis and set REDIS_URL. ({e!s})")
    await redis.aclose()

    if not relevant:
        raise ValueError("No chunks retrieved from Redis. Check REDIS_URL and try again.")

    # Build passages text: "Passage 0:\n...\n\nPassage 1:\n..."
    def passage_line(i: int, r: dict) -> str:
        title = r.get("material_title", "")
        page = r.get("page_or_slide")
        source = f"{title} page/slide {page}" if page is not None else title
        return f"Passage {i} (source: {source}):\n{r.get('content', '')[:4000]}"

    passages_text = "\n\n".join(passage_line(i, r) for i, r in enumerate(relevant))
    prompt = RAG_CONCEPT_EXTRACTION_PROMPT.format(passages_text=passages_text)
    response = await _call_llm(
        system="You output only valid JSON. No markdown, no explanation. source_passage must be an integer index.",
        user=prompt,
    )
    items = _parse_json_list(response)
    for item in items:
        if not isinstance(item, dict):
            continue
        name = (item.get("name") or "").strip()
        explanation = (item.get("explanation") or "").strip()
        source_passage = item.get("source_passage", 0)
        if isinstance(source_passage, dict):
            source_passage = 0
        try:
            idx = int(source_passage)
        except (TypeError, ValueError):
            idx = 0
        if idx < 0 or idx >= len(relevant):
            idx = 0
        ref = relevant[idx]
        source_span = (item.get("source_span") or "").strip() or None
        if not name or not explanation:
            continue
        concept = Concept(
            course_id=course_id,
            name=name,
            explanation=explanation,
            source_material_id=ref.get("material_id"),
            source_chunk_id=ref.get("chunk_id"),
            source_span=source_span,
        )
        session.add(concept)
        await session.flush()
        await _add_flashcard_and_question(session, concept, name, explanation, source_span)

    # Shorts flow: extract broad topics from uploaded material and generate short videos.
    materials_text = "\n\n".join(
        f"{r.get('material_title', '')}: {r.get('content', '')[:1200]}" for r in relevant
    )[:24000]
    topics_raw = await _call_llm(
        system="Return only a valid JSON array of short topic strings.",
        user=SHORTS_TOPICS_PROMPT.format(materials_text=materials_text),
    )
    topics = _parse_string_list(topics_raw)
    for topic in topics:
        await _create_short_video_for_topic(session, course_id, topic)

    await session.flush()
