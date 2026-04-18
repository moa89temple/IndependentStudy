const BASE = "/api";

export type Course = {
  id: number;
  name: string;
  slug: string;
  created_at: string;
};

export type Material = {
  id: number;
  course_id: number;
  file_path: string;
  file_type: string;
  title: string;
  created_at: string;
};

export type Concept = {
  id: number;
  course_id: number;
  name: string;
  explanation: string;
  source_material_id: number | null;
  source_chunk_id: number | null;
  source_span: string | null;
};

export type Flashcard = {
  id: number;
  concept_id: number;
  front: string;
  back: string;
};

export type PracticeQuestion = {
  id: number;
  concept_id: number;
  question: string;
  expected_answer: string;
  source_ref: string | null;
};

export type ReviewData = {
  flashcards: Flashcard[];
  questions: PracticeQuestion[];
};

export type AdminCounts = {
  courses: number;
  materials: number;
  text_chunks: number;
  concepts: number;
  flashcards: number;
  practice_questions: number;
  interactions: number;
  interactions_last_7d: number;
};

export type AdminInteractionTypeBreakdown = {
  target_type: string;
  total: number;
  correct: number;
};

export type AdminUserRollup = {
  user_id: string;
  total: number;
  correct: number;
};

export type AdminDailyActivity = {
  day: string;
  total: number;
  correct: number;
};

export type AdminCourseRollup = {
  course_id: number;
  name: string;
  slug: string;
  created_at: string;
  materials: number;
  concepts: number;
  flashcards: number;
  practice_questions: number;
  study_interactions: number;
};

export type AdminInsight = {
  title: string;
  detail: string;
  tone: "positive" | "neutral" | "warning";
};

export type AdminAnalytics = {
  generated_at: string;
  counts: AdminCounts;
  study: {
    interactions_total: number;
    interactions_last_7d: number;
    accuracy: number | null;
    distinct_users: number;
    correct_total: number;
  };
  interaction_types: AdminInteractionTypeBreakdown[];
  users: AdminUserRollup[];
  daily_activity: AdminDailyActivity[];
  courses: AdminCourseRollup[];
  insights: AdminInsight[];
};

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(Array.isArray(err.detail) ? err.detail[0]?.msg : err.detail || res.statusText);
  }
  return res.json();
}

export const api = {
  courses: {
    list: () => fetchApi<Course[]>(`/courses`),
    create: (name: string) =>
      fetchApi<Course>(`/courses`, { method: "POST", body: JSON.stringify({ name }) }),
    delete: (id: number) =>
      fetch(BASE + `/courses/${id}`, { method: "DELETE" }).then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "Course not found" : res.statusText);
      }),
  },
  materials: {
    upload: (courseId: number, file: File) => {
      const form = new FormData();
      form.append("file", file);
      return fetch(BASE + `/courses/${courseId}/materials`, {
        method: "POST",
        body: form,
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(err.detail || res.statusText);
        }
        return res.json() as Promise<Material>;
      });
    },
  },
  learning: {
    process: (courseId: number) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 min
      return fetch(BASE + `/courses/${courseId}/process`, {
        method: "POST",
        signal: controller.signal,
      })
        .then(async (res) => {
          clearTimeout(timeoutId);
          if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(Array.isArray(err.detail) ? err.detail[0]?.msg : err.detail || res.statusText);
          }
          return res.status === 204 ? {} : await res.json();
        })
        .catch((e) => {
          clearTimeout(timeoutId);
          if (e.name === "AbortError") throw new Error("Processing timed out. Try a smaller file or run Process again.");
          throw e;
        }) as Promise<{ status?: string }>;
    },
    concepts: (courseId: number) => fetchApi<Concept[]>(`/courses/${courseId}/concepts`),
    flashcards: (courseId: number) => fetchApi<Flashcard[]>(`/courses/${courseId}/flashcards`),
    questions: (courseId: number) => fetchApi<PracticeQuestion[]>(`/courses/${courseId}/questions`),
    review: (courseId: number) => fetchApi<ReviewData>(`/courses/${courseId}/review`),
  },
  interactions: {
    record: (data: {
      user_id?: string;
      target_type: "flashcard" | "question";
      target_id: number;
      correct: boolean;
    }) =>
      fetchApi<{ id: number }>(`/interactions`, {
        method: "POST",
        body: JSON.stringify({ user_id: "default", ...data }),
      }),
  },
  admin: {
    analytics: () => fetchApi<AdminAnalytics>(`/admin/analytics`),
  },
};
