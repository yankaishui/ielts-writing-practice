import type { Assessment } from "../types";
export const demoEssay = `Environmental problems are becoming more serious, but effective solutions remain difficult to implement. I believe this is mainly because economic interests often conflict with environmental goals and because governments struggle to coordinate their actions.

One reason is that companies are reluctant to change the way they operate. Cleaner equipment can be expensive, especially for small businesses with limited budgets. If a factory spends money on new machines, it may need to raise its prices and risk losing customers to cheaper competitors. As a result, even firms that recognise the problem may delay taking action. Another reason is that countries have different priorities. Some goverments focus on creating jobs and consider environmental protection a less urgent concern. This makes international cooperation difficult.

Several measures could help. Governments should provide financial support for businesses that invest in cleaner equipment. This would reduce the initial cost of changing production methods, making it easier for small firms to participate without sharply increasing their prices. They should also improve public transport. This would be good for the environment. In addition, international agreements should set clear targets and require countries to report their progress regularly. Public reporting would allow citizens to see whether promises are being kept and put pressure on leaders to act.

In conclusion, short-term economic concerns and a lack of coordination help explain why environmental problems persist. Financial support and clear international commitments could make progress more realistic. However, these measures will only work if governments maintain their efforts over time rather than announcing policies and then forgetting them.`;
export const demoAssessment: Assessment = {
  scores: {
    taskResponse: {
      score: 6.5,
      reason: "回应了题目的两个问题，但公共交通方案还需要解释其具体作用。",
    },
    coherenceCohesion: {
      score: 6.5,
      reason: "文章推进清楚，少数论点之间的联系仍需展开。",
    },
    lexicalResource: {
      score: 6,
      reason: "用词总体准确，存在少量重复和一处拼写问题。",
    },
    grammaticalRangeAccuracy: {
      score: 6.5,
      reason: "能够组合使用多种句式，整体语法控制较好。",
    },
  },
  diagnostics: {
    taskUnderstanding: 8,
    positionClarity: 7.5,
    ideaDevelopment: 6.5,
    supportingDetail: 5.5,
    logicalOrganisation: 7,
    vocabularyUse: 6.5,
    grammarAccuracy: 7,
    sentenceRange: 6.5,
  },
  problems: [
    {
      type: "language_error",
      category: "Spelling",
      confidence: "High",
      originalQuote: "goverments",
      correction: "governments",
      explanation: "这个单词漏写了字母 n，正确拼写是 governments。",
      howToImprove:
        "交卷前检查常用话题词，特别留意 governments 这类容易漏字母的词。",
      otherOccurrences: [],
    },
    {
      type: "writing_issue",
      category: "Supporting Detail",
      confidence: null,
      originalQuote:
        "They should also improve public transport. This would be good for the environment.",
      correction: "",
      explanation:
        "这里说公共交通“对环境有好处”，却没有解释它如何产生这种好处。",
      howToImprove:
        "说明一项具体的交通改善如何改变人们的通勤选择，再解释它与减少排放之间的联系。只使用你能合理说明的例子。",
      otherOccurrences: [],
    },
  ],
  strengths: [
    {
      category: "Idea Development",
      originalQuote:
        "If a factory spends money on new machines, it may need to raise its prices and risk losing customers to cheaper competitors.",
      whyItWorks:
        "从设备成本、产品价格到流失顾客，具体解释了企业不愿投资的原因。",
    },
    {
      category: "Collocation",
      originalQuote: "short-term economic concerns",
      whyItWorks: "搭配自然且含义准确，概括了环境政策面临的短期经济压力。",
    },
  ],
  upgrades: [
    {
      original: "This makes international cooperation difficult.",
      improved:
        "These competing priorities make international cooperation difficult.",
      reason:
        "用 competing priorities 点明困难来自不同优先事项，更明确，同时没有新增观点。",
    },
  ],
  usefulExpressions: [
    {
      expression: "short-term economic concerns",
      meaning: "对眼前经济成本或结果的担忧。",
      example:
        "Short-term economic concerns can delay investment in cleaner technology.",
      source: "Student",
    },
    {
      expression: "maintain their efforts over time",
      meaning: "长期持续投入努力，而不是只在开始时采取行动。",
      example: "Local authorities must maintain their efforts over time.",
      source: "Student",
    },
  ],
  nextPriority: {
    dimension: "Supporting Detail",
    reason:
      "你的立场是清楚的，但公共交通的论证停在“这样对环境好”，还没有讲清楚原因。",
    action:
      "用 5 分钟修改公共交通所在的段落：把这条建议展开为三步——具体改善什么、如何改变通勤选择、为什么可能减少排放。保留原来的立场，不编造数据。",
  },
};
