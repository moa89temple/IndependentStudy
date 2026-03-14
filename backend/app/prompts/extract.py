# RAG: multiple passages; source_passage is 0-based index into the passages list
RAG_CONCEPT_EXTRACTION_PROMPT = """You are extracting key concepts from course material. Below are several passages. List only concepts that are explicitly defined or clearly supported by these passages. Do not add concepts from general knowledge.

For each concept provide:
1. name: short concept name (e.g. "Marginal cost")
2. explanation: 1-3 sentences using the course's own wording and terminology.
3. source_passage: 0-based index of the passage that supports this concept (integer, 0 = first passage).
4. source_span: optional brief location within the passage (e.g. "page 2", "slide 3").

Output valid JSON only, as a list of objects with keys: name, explanation, source_passage, source_span.

Passages:
---
{passages_text}
---

JSON list of concepts:"""


FLASHCARD_PROMPT = """Create one flashcard for this concept. Use only the given explanation; do not add external knowledge.
Concept: {concept_name}
Explanation: {explanation}

Output valid JSON only: {{ "front": "question or term (shown first)", "back": "answer (shown after flip)" }}"""


PRACTICE_QUESTION_PROMPT = """Create one short-answer practice question for this concept. The expected answer should be scoped to the given explanation. Use instructor-style terminology.
Concept: {concept_name}
Explanation: {explanation}

Output valid JSON only: {{ "question": "one clear question", "expected_answer": "concise model answer" }}"""
