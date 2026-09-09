import { createContext, useContext, useState, type ReactNode } from "react";
import { storage, write } from "./services/storage";
import type {
  Question,
  Assessment,
  EssayAttempt,
  SavedExpression,
  FocusPractice,
} from "./types";
function useStoreValue() {
  const [attempts, setAttempts] = useState(storage.attempts),
    [assessments, setAssessments] = useState(storage.assessments),
    [expressions, setExpressions] = useState(storage.expressions),
    [practices, setPractices] = useState(storage.practices),
    [customQuestions, setCustomQuestions] = useState(storage.customQuestions);
  return {
    customQuestions,
    saveCustomQuestion: (q: Question) => {
      const existing = customQuestions.find(
        (x) =>
          x.text.trim().toLowerCase() === q.text.trim().toLowerCase() &&
          x.topic === q.topic &&
          x.questionType === q.questionType,
      );
      const next = existing
        ? customQuestions
        : [...customQuestions, { ...q, custom: true }];
      write("customQuestions", next);
      setCustomQuestions(next);
      return existing ?? q;
    },
    attempts,
    assessments,
    expressions,
    practices,
    savePractice: (p: FocusPractice) => {
      const existing = practices.find((x) => x.id === p.id);
      if (existing?.finishedAt)
        throw new Error("已完成的专项练习已锁定，请开始新一轮练习。");
      const next = existing
        ? practices.map((x) => (x.id === p.id ? p : x))
        : [...practices, p];
      write("practices", next);
      setPractices(next);
    },
    addAttempt: (a: EssayAttempt) => {
      const next = [...attempts, a];
      write("attempts", next);
      setAttempts(next);
    },
    addAssessment: (id: string, a: Assessment) => {
      const next = { ...assessments, [id]: a };
      write("assessments", next);
      setAssessments(next);
    },
    saveExpression: (
      e: Omit<SavedExpression, "id" | "dateSaved" | "status">,
    ) => {
      if (
        expressions.some(
          (x) =>
            x.expression === e.expression &&
            x.sourceEssayId === e.sourceEssayId,
        )
      )
        return;
      const next = [
        ...expressions,
        {
          ...e,
          id: crypto.randomUUID(),
          dateSaved: new Date().toISOString(),
          status: "Learning" as const,
        },
      ];
      write("expressions", next);
      setExpressions(next);
    },
    updateExpression: (
      id: string,
      status: SavedExpression["status"] | "Delete",
    ) => {
      const next =
        status === "Delete"
          ? expressions.filter((e) => e.id !== id)
          : expressions.map((e) => (e.id === id ? { ...e, status } : e));
      write("expressions", next);
      setExpressions(next);
    },
    reload: () => {
      setAttempts(storage.attempts());
      setAssessments(storage.assessments());
      setExpressions(storage.expressions());
      setPractices(storage.practices());
      setCustomQuestions(storage.customQuestions());
    },
  };
}
const Context = createContext<ReturnType<typeof useStoreValue> | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useStoreValue();
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error("Missing store");
  return store;
}
