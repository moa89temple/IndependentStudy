import type { AdminAnalytics } from "../api";

function demoHeatmapCells(): { gx: number; gy: number; count: number }[] {
  const bumps: [number, number, number][] = [
    [16, 1, 380],
    [17, 1, 340],
    [18, 2, 290],
    [15, 2, 260],
    [10, 5, 420],
    [11, 5, 410],
    [9, 6, 360],
    [12, 6, 355],
    [10, 6, 330],
    [11, 6, 300],
    [8, 7, 240],
    [13, 7, 230],
    [10, 7, 210],
    [3, 3, 180],
    [4, 3, 175],
    [2, 4, 160],
    [5, 8, 150],
    [6, 8, 145],
    [14, 9, 130],
    [15, 9, 125],
    [7, 4, 120],
    [18, 8, 110],
    [1, 2, 95],
    [19, 3, 90],
    [12, 3, 85],
    [10, 4, 80],
  ];
  return bumps.map(([gx, gy, count]) => ({ gx, gy, count }));
}

const heatCells = demoHeatmapCells();
const heatMax = Math.max(...heatCells.map((c) => c.count), 1);

export const DEMO_ADMIN_ANALYTICS: AdminAnalytics = {
  generated_at: new Date().toISOString(),
  counts: {
    courses: 14,
    materials: 37,
    text_chunks: 812,
    concepts: 286,
    flashcards: 540,
    practice_questions: 198,
    interactions: 4250,
    interactions_last_7d: 980,
  },
  study: {
    interactions_total: 4250,
    interactions_last_7d: 980,
    accuracy: 0.742,
    distinct_users: 6,
    correct_total: 3154,
  },
  interaction_types: [
    { target_type: "flashcard", total: 2980, correct: 2310 },
    { target_type: "question", total: 1270, correct: 844 },
  ],
  users: [
    { user_id: "user_alex", total: 1520, correct: 1188 },
    { user_id: "user_bailey", total: 980, correct: 702 },
    { user_id: "user_chen", total: 640, correct: 502 },
    { user_id: "default", total: 610, correct: 412 },
    { user_id: "user_devon", total: 320, correct: 210 },
    { user_id: "user_elin", total: 180, correct: 140 },
  ],
  daily_activity: (() => {
    const out: { day: string; total: number; correct: number }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const day = d.toISOString().slice(0, 10);
      const wave = 40 + Math.round(35 * Math.sin(i / 4) + (i % 7) * 8);
      const total = Math.max(12, wave + (i % 5) * 6);
      const correct = Math.round(total * (0.62 + (i % 3) * 0.05));
      out.push({ day, total, correct });
    }
    return out;
  })(),
  courses: [
    {
      course_id: 101,
      name: "Cell Biology",
      slug: "cell-biology",
      created_at: new Date().toISOString(),
      materials: 6,
      concepts: 48,
      flashcards: 96,
      practice_questions: 32,
      study_interactions: 820,
    },
    {
      course_id: 102,
      name: "Linear Algebra",
      slug: "linear-algebra",
      created_at: new Date().toISOString(),
      materials: 4,
      concepts: 62,
      flashcards: 120,
      practice_questions: 44,
      study_interactions: 1105,
    },
    {
      course_id: 103,
      name: "Ethics (compressed)",
      slug: "ethics-compressed",
      created_at: new Date().toISOString(),
      materials: 3,
      concepts: 0,
      flashcards: 0,
      practice_questions: 0,
      study_interactions: 0,
    },
    {
      course_id: 104,
      name: "Operating Systems",
      slug: "operating-systems",
      created_at: new Date().toISOString(),
      materials: 5,
      concepts: 54,
      flashcards: 108,
      practice_questions: 40,
      study_interactions: 640,
    },
  ],
  insights: [
    {
      title: "Strong weekly study cadence",
      detail:
        "Attempts are concentrated mid-week with healthy weekend volume. Consider lightweight Sunday reminders to smooth retention.",
      tone: "positive",
    },
    {
      title: "One course is stuck before concepts",
      detail:
        "A course has uploads but zero extracted concepts—triage parsing failures or rerun Process with smaller batches.",
      tone: "warning",
    },
    {
      title: "Flashcards outperform questions",
      detail:
        "Flashcards account for most attempts. If you want deeper recall, surface practice questions earlier in the Study flow.",
      tone: "neutral",
    },
    {
      title: "UX clicks cluster on navigation and study controls",
      detail:
        "Recorded click density skews toward the top bar and central study actions—good IA alignment; watch for mis-taps on small mobile targets.",
      tone: "neutral",
    },
  ],
  ux: {
    window_days: 30,
    total_clicks: 8420,
    heatmap: { columns: 20, rows: 12, max_count: heatMax, cells: heatCells },
    top_elements: [
      { element_key: "study-flashcard-correct", clicks: 980, last_path: "/courses/102/study" },
      { element_key: "study-flashcard-incorrect", clicks: 720, last_path: "/courses/102/study" },
      { element_key: "study-tab-flashcards", clicks: 610, last_path: "/courses/101/study" },
      { element_key: "course-process", clicks: 540, last_path: "/courses/103" },
      { element_key: "study-tab-questions", clicks: 520, last_path: "/courses/104/study" },
      { element_key: "course-study", clicks: 480, last_path: "/courses/101" },
      { element_key: "study-show-answer", clicks: 460, last_path: "/courses/104/study" },
      { element_key: "home-create-course", clicks: 410, last_path: "/" },
      { element_key: "nav-admin", clicks: 390, last_path: "/courses/101" },
      { element_key: "course-upload", clicks: 360, last_path: "/courses/103" },
      { element_key: "nav-brand", clicks: 340, last_path: "/courses/102/study" },
      { element_key: "study-question-correct", clicks: 310, last_path: "/courses/104/study" },
      { element_key: "study-flip-card", clicks: 280, last_path: "/courses/101/study" },
      { element_key: "home-open-course", clicks: 250, last_path: "/" },
      { element_key: "course-delete", clicks: 40, last_path: "/courses/103" },
    ],
  },
};
