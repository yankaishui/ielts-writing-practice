import type { Question } from "../types";

// Paraphrases of candidate-reported topics, not verbatim or authenticated exam papers.
// Source pages checked 2026-09-07. Stable IDs preserve existing attempt references.
const groups: {
  topic: string;
  slug: string;
  rows: [Question["questionType"], string][];
}[] = [
  {
    topic: "Education",
    slug: "education",
    rows: [
      [
        "Advantages / Disadvantages",
        "Schools sometimes arrange overseas exchanges for teenage pupils. Assess whether the educational gains of these visits are greater than their drawbacks.",
      ],
      [
        "Opinion",
        "Computer literacy is sometimes proposed as a core school skill alongside numeracy, reading and writing. How far do you support this proposal?",
      ],
      [
        "Discussion",
        "Who should take primary responsibility for discipline at school: parents or teachers? Consider the arguments for each position and explain your own judgement.",
      ],
      [
        "Two-part Question",
        "Certain parents place intense academic pressure on their children. Explain what motivates this behaviour and describe the role parents ought to play in their children's education.",
      ],
    ],
  },
  {
    topic: "Environment",
    slug: "environment",
    rows: [
      [
        "Discussion",
        "People disagree about whether damage to wildlife caused by human activity can still be reversed. Examine both positions and state which you find more convincing.",
      ],
      [
        "Opinion",
        "Raising fuel prices is proposed as the most effective response to worldwide environmental damage. How far do you support this approach?",
      ],
      [
        "Discussion",
        "An annual worldwide day without cars is proposed to tackle polluted air, but critics favour other approaches. Evaluate the two positions and explain your judgement.",
      ],
      [
        "Two-part Question",
        "Urban expansion is putting scenic natural areas under pressure. Explain the value of preserving these places and suggest ways to prevent their disappearance.",
      ],
    ],
  },
  {
    topic: "Crime",
    slug: "crime-and-punishment",
    rows: [
      [
        "Opinion",
        "Improvements in crime prevention and detection technology are said to explain falling crime levels. How far do you accept this explanation?",
      ],
      [
        "Problem / Solution",
        "Some former prisoners offend again shortly after returning to society. Analyse the reasons for this pattern and propose ways to reduce reoffending.",
      ],
      [
        "Opinion",
        "For serious offences, some argue that teenage offenders should face the same penalties as adults. How far do you support this policy?",
      ],
      [
        "Advantages / Disadvantages",
        "A justice system may use predetermined penalties instead of deciding each punishment individually. Examine the benefits and drawbacks of such a system.",
      ],
    ],
  },
  {
    topic: "Work",
    slug: "work",
    rows: [
      [
        "Advantages / Disadvantages",
        "Some businesses expect employees to remain reachable during holidays and other time off. Evaluate whether the benefits of this expectation exceed its costs.",
      ],
      [
        "Discussion",
        "A university qualification is considered by some the strongest route into desirable employment; others favour experience and interpersonal skills. Weigh these views and present your own position.",
      ],
      [
        "Two-part Question",
        "In poorer economies, enjoying one's job is sometimes regarded as an unattainable luxury. Explain why this attitude exists and assess the importance of satisfaction at work.",
      ],
      [
        "Problem / Solution",
        "Workers often struggle to make enough room for personal life alongside employment. Identify the causes of this difficulty and propose practical remedies.",
      ],
    ],
  },
  {
    topic: "Technology",
    slug: "technology",
    rows: [
      [
        "Advantages / Disadvantages",
        "Machines increasingly perform domestic tasks that people once completed manually. Consider whether the gains from this change exceed the disadvantages.",
      ],
      [
        "Opinion",
        "Devices such as smartphones are sometimes blamed for weakening people's social interactions. How far do you share this view?",
      ],
      [
        "Two-part Question",
        "Digital tools have become widespread at work. Describe their effects on working practices and examine the risks of depending on them excessively.",
      ],
      [
        "Discussion",
        "Some believe access to modern technology widens economic inequality, whereas others think it narrows the divide. Evaluate both arguments and explain your own conclusion.",
      ],
    ],
  },
  {
    topic: "Health",
    slug: "health",
    rows: [
      [
        "Opinion",
        "Public health budgets should give prevention a higher priority than curing illness. How far do you support this allocation of resources?",
      ],
      [
        "Problem / Solution",
        "Excess weight is exposing increasing numbers of people to serious illness. Explain why this is happening and suggest effective responses.",
      ],
      [
        "Two-part Question",
        "Longer school sports sessions have been proposed to address childhood obesity. Assess whether this is the strongest response and suggest other possible measures.",
      ],
      [
        "Discussion",
        "Responsibility for maintaining public health is sometimes assigned to the state and sometimes to individuals. Consider both approaches and set out your own position.",
      ],
    ],
  },
];

export const recalledQuestions: Question[] = groups.flatMap(
  ({ topic, slug, rows }) =>
    rows.map(([questionType, text], i) => ({
      id: `recalled-${slug}-${i + 1}`,
      topic,
      questionType,
      text,
      source: {
        name: "IELTS Liz · 考生回忆题",
        url: `https://ieltsliz.com/100-ielts-essay-questions/${slug}/`,
      },
    })),
);
