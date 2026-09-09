import { useEffect, useRef, useState } from "react";
import { storage } from "../services/storage";
import type { Draft } from "../types";
export function closeAway(d: Draft, now: number): Draft {
  if (d.awayStarted === null) return d;
  return {
    ...d,
    awayStarted: null,
    focusEvents: [
      ...d.focusEvents,
      {
        startTime: new Date(d.awayStarted).toISOString(),
        returnTime: new Date(now).toISOString(),
        duration: Math.max(0, (now - d.awayStarted) / 1000),
      },
    ],
  };
}
export function useExam(
  key: string,
  initial: string,
  minutes: number,
  onExpire: (d: Draft, end: number) => void,
) {
  const [draft, setDraft] = useState<Draft>(() => {
    const saved = storage.draft();
    return saved?.key === key
      ? closeAway(
          saved,
          Math.min(
            Date.now(),
            saved.started ? saved.started + saved.limit * 1000 : Date.now(),
          ),
        )
      : {
          key,
          text: initial,
          started: null,
          limit: minutes * 60,
          mode: "Practice",
          focusEvents: [],
          awayStarted: null,
          lastInput: null,
          longestPause: 0,
          inputEvents: 0,
        };
  });
  const current = useRef(draft);
  current.current = draft;
  const expire = useRef(onExpire);
  expire.current = onExpire;
  const [now, setNow] = useState(Date.now()),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const done = useRef(false);
  function persist(d: Draft) {
    current.current = d;
    setDraft(d);
    try {
      const existing = storage.draft();
      if (d.started || !existing?.started || existing.key === d.key)
        storage.saveDraft(d);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    const interval = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      const d = current.current;
      if (d.started && !done.current && time >= d.started + d.limit * 1000) {
        done.current = true;
        expire.current(
          closeAway(d, d.started + d.limit * 1000),
          d.started + d.limit * 1000,
        );
      }
    }, 250);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    function away() {
      const d = current.current;
      if (
        !d.started ||
        done.current ||
        d.mode !== "Strict" ||
        d.awayStarted !== null
      )
        return;
      persist({ ...d, awayStarted: Date.now() });
    }
    function back() {
      const d = current.current;
      if (document.hidden || !document.hasFocus() || d.awayStarted === null)
        return;
      persist(closeAway(d, Math.min(Date.now(), d.started! + d.limit * 1000)));
      setNotice("已记录一次离开页面");
    }
    function visibility() {
      if (document.hidden) away();
      else back();
    }
    function unload(e: BeforeUnloadEvent) {
      if (current.current.started && !done.current) {
        away();
        e.preventDefault();
        e.returnValue = "";
      }
    }
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", away);
    window.addEventListener("focus", back);
    window.addEventListener("beforeunload", unload);
    return () => {
      away();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", away);
      window.removeEventListener("focus", back);
      window.removeEventListener("beforeunload", unload);
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timeout);
  }, [notice]);
  return {
    draft,
    notice,
    error,
    remaining: draft.started
      ? Math.max(
          0,
          Math.ceil((draft.started + draft.limit * 1000 - now) / 1000),
        )
      : draft.limit,
    configure: (patch: Partial<Draft>) =>
      persist({ ...current.current, ...patch }),
    start: () => {
      done.current = false;
      persist({
        ...current.current,
        started: Date.now(),
        lastInput: Date.now(),
      });
    },
    input: (text: string) => {
      const d = current.current,
        time = Date.now();
      if (!d.started || time >= d.started + d.limit * 1000) return;
      persist({
        ...d,
        text,
        inputEvents: d.inputEvents + 1,
        longestPause: Math.max(
          d.longestPause,
          (time - (d.lastInput ?? d.started)) / 1000,
        ),
        lastInput: time,
      });
    },
    finish: () => {
      done.current = true;
      return closeAway(
        current.current,
        Math.min(
          Date.now(),
          current.current.started! + current.current.limit * 1000,
        ),
      );
    },
    retry: () => {
      done.current = false;
    },
  };
}
