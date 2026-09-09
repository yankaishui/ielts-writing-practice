import { suppliedQuestions } from "./suppliedQuestions";
import { recalledQuestions } from "./recalledQuestions";
import type { Question } from "../types";
const rows: [Question["questionType"], string, string][] = [
  [
    "Two-part Question",
    "Environment",
    "There are many environmental problems, such as the greenhouse effect and climate change, and people have hardly found any solutions. Why is this the case? And what measures can be taken?",
  ],
  [
    "Opinion",
    "Education",
    "Some people believe that university education should be free for everyone. To what extent do you agree or disagree?",
  ],
  [
    "Discussion",
    "Education",
    "Some people think schools should teach practical skills, while others believe academic subjects are more important. Discuss both views and give your own opinion.",
  ],
  [
    "Advantages / Disadvantages",
    "Technology",
    "More people are working from home using digital technology. Do the advantages of this development outweigh the disadvantages?",
  ],
  [
    "Problem / Solution",
    "Transport",
    "Traffic congestion is increasing in many cities. What problems does this cause, and what measures could solve them?",
  ],
  [
    "Two-part Question",
    "Family",
    "In many countries, people are choosing to have children later in life. Why is this happening? How does this affect families and society?",
  ],
  [
    "Opinion",
    "Government",
    "Governments should spend more money on public transport than on building new roads. To what extent do you agree or disagree?",
  ],
  [
    "Discussion",
    "Crime",
    "Some people believe that longer prison sentences reduce crime, while others favour alternative punishments. Discuss both views and give your opinion.",
  ],
  [
    "Advantages / Disadvantages",
    "Globalisation",
    "An increasing number of people move abroad for work. Do the advantages of this trend outweigh the disadvantages?",
  ],
  [
    "Problem / Solution",
    "Health",
    "Many people lead increasingly inactive lives. What problems does this cause, and how can these problems be addressed?",
  ],
  [
    "Two-part Question",
    "Media",
    "People increasingly get their news from social media. Why is this the case? Is this a positive or negative development?",
  ],
  [
    "Opinion",
    "Work",
    "A good salary is more important than job satisfaction. To what extent do you agree or disagree?",
  ],
  [
    "Discussion",
    "Environment",
    "Some people think individuals are responsible for protecting the environment, while others believe governments and large companies should take responsibility. Discuss both views and give your opinion.",
  ],
  [
    "Advantages / Disadvantages",
    "Education",
    "Many universities now offer courses online. Do the advantages of online learning outweigh its disadvantages?",
  ],
  [
    "Problem / Solution",
    "Society",
    "Many older people experience loneliness. What are the causes, and what solutions can you suggest?",
  ],
  [
    "Two-part Question",
    "Technology",
    "Children spend more time using electronic devices than in the past. Why is this happening? What effects does this have on their development?",
  ],
  [
    "Opinion",
    "Health",
    "Advertising unhealthy food should be banned. To what extent do you agree or disagree?",
  ],
  [
    "Discussion",
    "Government",
    "Some people think governments should fund the arts, while others argue that public money should only support essential services. Discuss both views and give your opinion.",
  ],
  [
    "Advantages / Disadvantages",
    "Transport",
    "International air travel has become more accessible. Do the advantages of this development outweigh the disadvantages?",
  ],
  [
    "Problem / Solution",
    "Work",
    "Many employees struggle to balance their work and personal lives. What causes this problem, and what solutions can you suggest?",
  ],
  [
    "Opinion",
    "Family",
    "Parents should be responsible for teaching children how to be good members of society. To what extent do you agree or disagree?",
  ],
  [
    "Discussion",
    "Media",
    "Some people believe advertising helps consumers make choices, while others believe it encourages unnecessary spending. Discuss both views and give your own opinion.",
  ],
  [
    "Two-part Question",
    "Globalisation",
    "Traditional customs are disappearing in some countries. Why is this happening? What can be done to preserve them?",
  ],
  [
    "Advantages / Disadvantages",
    "Society",
    "More people now live alone than in the past. Do the advantages of this development outweigh the disadvantages?",
  ],
];
const originalQuestions: Question[] = rows.map(
  ([questionType, topic, text], i) => ({
    id: `q${i + 1}`,
    questionType,
    topic,
    text,
  }),
);

const previousQuestions: Question[] = [
  ...originalQuestions,
  ...recalledQuestions,
];

// Manual semantic matches: same task, even where wording differs.
export const questionAliases: Record<string, string> = {
  "supplied-2023-64": "supplied-2024-24",
  "supplied-2023-43": "q20",
  "supplied-2023-47": "recalled-crime-and-punishment-2",
  "recalled-work-4": "q20",
};
const replacements = new Map(
  suppliedQuestions
    .filter((q) => q.id === "supplied-2023-43" || q.id === "supplied-2023-47")
    .map((q) => [questionAliases[q.id], q]),
);
export const questions: Question[] = [
  ...previousQuestions
    .filter((q) => !questionAliases[q.id])
    .map((q) => {
      const incoming = replacements.get(q.id);
      return incoming ? { ...incoming, id: q.id } : q;
    }),
  ...suppliedQuestions.filter((q) => !questionAliases[q.id]),
];
// Retired IDs remain resolvable; saved essays retain their own question snapshot.
export const findQuestion = (id: string | undefined) =>
  questions.find((q) => q.id === id) ??
  previousQuestions.find((q) => q.id === id) ??
  questions.find((q) => q.id === questionAliases[id ?? ""]);
