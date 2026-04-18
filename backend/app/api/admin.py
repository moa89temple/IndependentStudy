from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Concept, Course, Flashcard, Interaction, Material, PracticeQuestion, TextChunk
from app.schemas.admin import (
    AnalyticsOut,
    CountsOut,
    CourseRollupOut,
    DailyActivityOut,
    InsightOut,
    InteractionTypeBreakdownOut,
    UserRollupOut,
)

router = APIRouter()


async def _scalar_count(db: AsyncSession, model) -> int:
    r = await db.execute(select(func.count()).select_from(model))
    v = r.scalar_one()
    return int(v or 0)


@router.get("/analytics", response_model=AnalyticsOut)
async def admin_analytics(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    courses_n = await _scalar_count(db, Course)
    materials_n = await _scalar_count(db, Material)
    chunks_n = await _scalar_count(db, TextChunk)
    concepts_n = await _scalar_count(db, Concept)
    flashcards_n = await _scalar_count(db, Flashcard)
    questions_n = await _scalar_count(db, PracticeQuestion)

    agg_row = (
        await db.execute(
            select(
                func.count(Interaction.id),
                func.sum(case((Interaction.correct.is_(True), 1), else_=0)),
            )
        )
    ).one()
    interactions_n = int(agg_row[0] or 0)
    total_correct_all = int(agg_row[1] or 0)

    du_row = await db.execute(select(func.count(func.distinct(Interaction.user_id))))
    distinct_users = int(du_row.scalar_one() or 0)

    r7 = await db.execute(select(func.count()).select_from(Interaction).where(Interaction.at >= week_ago))
    interactions_7d = int(r7.scalar_one() or 0)

    type_rows = (
        await db.execute(
            select(
                Interaction.target_type,
                func.count(Interaction.id),
                func.sum(case((Interaction.correct.is_(True), 1), else_=0)),
            ).group_by(Interaction.target_type)
        )
    ).all()
    interaction_types = [
        InteractionTypeBreakdownOut(
            target_type=str(row[0] or "unknown"),
            total=int(row[1] or 0),
            correct=int(row[2] or 0),
        )
        for row in type_rows
    ]

    user_rows = (
        await db.execute(
            select(
                Interaction.user_id,
                func.count(Interaction.id),
                func.sum(case((Interaction.correct.is_(True), 1), else_=0)),
            ).group_by(Interaction.user_id).order_by(func.count(Interaction.id).desc()).limit(50)
        )
    ).all()
    users = [
        UserRollupOut(user_id=str(row[0]), total=int(row[1] or 0), correct=int(row[2] or 0))
        for row in user_rows
    ]

    day_rows = (
        await db.execute(
            select(
                func.date(Interaction.at).label("d"),
                func.count(Interaction.id),
                func.sum(case((Interaction.correct.is_(True), 1), else_=0)),
            )
            .where(Interaction.at >= month_ago)
            .group_by(func.date(Interaction.at))
            .order_by(func.date(Interaction.at))
        )
    ).all()
    daily_activity = [
        DailyActivityOut(
            day=str(row[0]) if row[0] is not None else "",
            total=int(row[1] or 0),
            correct=int(row[2] or 0),
        )
        for row in day_rows
        if row[0] is not None
    ]

    mat_map: dict[int, int] = defaultdict(int)
    for cid, n in (await db.execute(select(Material.course_id, func.count(Material.id)).group_by(Material.course_id))).all():
        mat_map[int(cid)] = int(n or 0)

    con_map: dict[int, int] = defaultdict(int)
    for cid, n in (await db.execute(select(Concept.course_id, func.count(Concept.id)).group_by(Concept.course_id))).all():
        con_map[int(cid)] = int(n or 0)

    fc_map: dict[int, int] = defaultdict(int)
    for cid, n in (
        await db.execute(
            select(Concept.course_id, func.count(Flashcard.id))
            .join(Flashcard, Flashcard.concept_id == Concept.id)
            .group_by(Concept.course_id)
        )
    ).all():
        fc_map[int(cid)] = int(n or 0)

    pq_map: dict[int, int] = defaultdict(int)
    for cid, n in (
        await db.execute(
            select(Concept.course_id, func.count(PracticeQuestion.id))
            .join(PracticeQuestion, PracticeQuestion.concept_id == Concept.id)
            .group_by(Concept.course_id)
        )
    ).all():
        pq_map[int(cid)] = int(n or 0)

    study_by_course: dict[int, int] = defaultdict(int)
    fc_i = await db.execute(
        select(Concept.course_id, func.count(Interaction.id))
        .select_from(Interaction)
        .join(Flashcard, and_(Interaction.target_type == "flashcard", Flashcard.id == Interaction.target_id))
        .join(Concept, Concept.id == Flashcard.concept_id)
        .group_by(Concept.course_id)
    )
    for cid, n in fc_i.all():
        study_by_course[int(cid)] += int(n or 0)

    q_i = await db.execute(
        select(Concept.course_id, func.count(Interaction.id))
        .select_from(Interaction)
        .join(
            PracticeQuestion,
            and_(Interaction.target_type == "question", PracticeQuestion.id == Interaction.target_id),
        )
        .join(Concept, Concept.id == PracticeQuestion.concept_id)
        .group_by(Concept.course_id)
    )
    for cid, n in q_i.all():
        study_by_course[int(cid)] += int(n or 0)

    all_course_ids = [int(x) for x in (await db.execute(select(Course.id))).scalars().all()]

    cr = await db.execute(select(Course).order_by(Course.created_at.desc()).limit(30))
    course_models = list(cr.scalars().all())
    courses_out = [
        CourseRollupOut(
            course_id=c.id,
            name=c.name,
            slug=c.slug,
            created_at=c.created_at.isoformat() if c.created_at else "",
            materials=mat_map.get(c.id, 0),
            concepts=con_map.get(c.id, 0),
            flashcards=fc_map.get(c.id, 0),
            practice_questions=pq_map.get(c.id, 0),
            study_interactions=study_by_course.get(c.id, 0),
        )
        for c in course_models
    ]

    accuracy = (total_correct_all / interactions_n) if interactions_n else None

    fc_type = next((x for x in interaction_types if x.target_type == "flashcard"), None)
    q_type = next((x for x in interaction_types if x.target_type == "question"), None)
    fc_total = fc_type.total if fc_type else 0
    q_total = q_type.total if q_type else 0

    courses_with_mats_no_concepts = sum(
        1 for cid in all_course_ids if mat_map.get(cid, 0) > 0 and con_map.get(cid, 0) == 0
    )
    courses_with_content_no_study = sum(
        1
        for cid in all_course_ids
        if (fc_map.get(cid, 0) + pq_map.get(cid, 0)) > 0 and study_by_course.get(cid, 0) == 0
    )

    insights: list[InsightOut] = []

    if courses_n == 0:
        insights.append(
            InsightOut(
                title="No courses yet",
                detail="Create a first course and upload materials to start measuring funnel and study engagement.",
                tone="neutral",
            )
        )

    if materials_n > 0 and concepts_n == 0:
        insights.append(
            InsightOut(
                title="Processing pipeline may be idle",
                detail="Materials exist but there are no concepts. Run Process on courses or verify extraction is succeeding.",
                tone="warning",
            )
        )

    if concepts_n > 0 and interactions_n == 0:
        insights.append(
            InsightOut(
                title="Study mode not recording usage",
                detail="Concepts exist but there are zero recorded interactions. Confirm the Study page is reachable and interaction logging is enabled.",
                tone="warning",
            )
        )

    if accuracy is not None and interactions_n >= 15 and accuracy < 0.55:
        insights.append(
            InsightOut(
                title="Learners may be struggling",
                detail=f"Overall accuracy is about {accuracy * 100:.0f}% across {interactions_n} attempts. Tighten prompts, add hints, or split difficult concepts.",
                tone="warning",
            )
        )

    if accuracy is not None and interactions_n >= 15 and accuracy >= 0.8:
        insights.append(
            InsightOut(
                title="Strong mastery signal",
                detail="High accuracy with meaningful volume suggests content difficulty is well matched for current users.",
                tone="positive",
            )
        )

    if fc_total > 0 and q_total > 0:
        ratio = fc_total / (q_total + 0.001)
        if ratio > 3:
            insights.append(
                InsightOut(
                    title="Flashcards dominate practice",
                    detail="Users answer far more flashcards than questions. If depth of recall matters, promote free-response questions in the Study UI.",
                    tone="neutral",
                )
            )
        elif ratio < 0.33:
            insights.append(
                InsightOut(
                    title="Questions dominate practice",
                    detail="Free-response is carrying most attempts. If fatigue is an issue, balance with quicker flashcard reps.",
                    tone="neutral",
                )
            )

    if courses_with_mats_no_concepts > 0:
        insights.append(
            InsightOut(
                title="Courses stuck before concepts",
                detail=f"{courses_with_mats_no_concepts} course(s) have materials but zero concepts—prioritize processing failures or empty extractions.",
                tone="warning",
            )
        )

    if courses_with_content_no_study > 0 and interactions_n > 0:
        insights.append(
            InsightOut(
                title="Uneven engagement across courses",
                detail=f"{courses_with_content_no_study} course(s) have generated study items but no recorded attempts. Improve course discoverability or nudge users back in.",
                tone="neutral",
            )
        )

    if distinct_users == 1 and users and users[0].user_id == "default":
        insights.append(
            InsightOut(
                title="User attribution is coarse",
                detail='All traffic is bucketed under user_id "default". When you add auth, pass stable user IDs in interaction payloads for cohort analysis.',
                tone="neutral",
            )
        )

    if interactions_7d == 0 and interactions_n > 0:
        insights.append(
            InsightOut(
                title="Recent activity dropped",
                detail="There is historical study data but nothing in the last 7 days. Consider re-engagement or checking deployments/logging.",
                tone="warning",
            )
        )

    if not insights:
        insights.append(
            InsightOut(
                title="Baseline established",
                detail="Collect more courses, materials, and study sessions to unlock richer funnel and retention views.",
                tone="neutral",
            )
        )

    study = {
        "interactions_total": interactions_n,
        "interactions_last_7d": interactions_7d,
        "accuracy": None if accuracy is None else round(accuracy, 4),
        "distinct_users": distinct_users,
        "correct_total": total_correct_all,
    }

    return AnalyticsOut(
        generated_at=now.isoformat() + "Z",
        counts=CountsOut(
            courses=courses_n,
            materials=materials_n,
            text_chunks=chunks_n,
            concepts=concepts_n,
            flashcards=flashcards_n,
            practice_questions=questions_n,
            interactions=interactions_n,
            interactions_last_7d=interactions_7d,
        ),
        study=study,
        interaction_types=interaction_types,
        users=users,
        daily_activity=daily_activity,
        courses=courses_out,
        insights=insights,
    )
