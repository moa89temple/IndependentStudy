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


SHORTS_TOPICS_PROMPT = """You are given excerpts from uploaded learning materials.
Identify the broad teachable topics that are explicitly present in this content.

Rules:
- Return ONLY a valid JSON array of strings.
- Each string must be a concise topic title (2-8 words).
- Include between 1 and 2 topics.
- Choose the most generic topics that includes the most content.
- Topics must be distinct and non-overlapping.
- Prefer curriculum-level themes over tiny details.
- Do not invent topics not supported by the material.

Material excerpts:
---
{materials_text}
---

Return JSON only, example:
["Topic 1", "Topic 2"]"""


SHORTS_DIALOGUE_PROMPT = """You are an AI dialogue writer.
I will give you one general topic.
You must output a JSON array (not a dictionary) of dialogue objects between Peter and Stewie from Family Guy.

Each object must follow exactly:
{
  "dialogue": "Peter: your text here",
  "character": "Peter",
  "image": "peter.png",
  "image_search": "short visual reference relevant to the topic",
  "audio_processed": 0,
  "audio_process_retry": 0
}

and similarly for Stewie with:
- "character": "Stewie"
- "image": "stewie.png"

Rules:
- Cover the topic thoroughly as an educational sequence.
- Keep it funny, conversational, and teaching-oriented.
- Peter asks/jokes/learns; Stewie explains clearly and accurately.
- Max 32 dialogue objects.
- Keep each dialogue under 100 characters unless clarity truly requires more.
- Speakers must start dialogue text in English: "Peter:" or "Stewie:".
- Set "image_search" only when useful, else "".
- Output ONLY valid JSON array, no markdown, no prose.

example:
[
  {
    "dialogue": "Peter: Hey Stewie, everyone keeps saying transformers changed AI. Like Optimus Prime?",
    "character": "Peter",
    "image": "peter.png",
    "image_search": "",
    "audio_processed": 0,
    "audio_process_retry": 0
  },
  {
    "dialogue": "Stewie: Sadly no, Peter. These transformers are neural network architectures from a 2017 paper.",
    "character": "Stewie",
    "image": "stewie.png",
    "image_search": "transformer architecture AI diagram",
    "audio_processed": 0,
    "audio_process_retry": 0
  },
  {
    "dialogue": "Peter: So what made them such a big deal?",
    "character": "Peter",
    "image": "peter.png",
    "image_search": "",
    "audio_processed": 0,
    "audio_process_retry": 0
  }
]

Topic:
{topic}
"""
