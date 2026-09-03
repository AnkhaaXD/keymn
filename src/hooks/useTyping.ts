import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { generatePracticeText } from '../utils/generateWords'

const STORAGE_KEY = 'keymn-profile-v2'
export type Lesson = { date: string; wpm: number; accuracy: number; seconds: number }
export type KeyStat = { attempts: number; errors: number; correct: number }
export type Profile = { lessons: Lesson[]; keyStats: Record<string, KeyStat>; totalSeconds: number; lastPracticeDate: string }
const emptyProfile: Profile = { lessons: [], keyStats: {}, totalSeconds: 0, lastPracticeDate: '' }
const getDate = () => new Date().toISOString().slice(0, 10)

// Decay factor applied to accumulated key stats each time a lesson is saved,
// so old mistakes gradually stop counting as "weak" once a key is practiced again.
const KEY_STAT_DECAY = 0.95
// Minimum attempts before a key's error rate is treated as fully reliable.
const CONFIDENCE_ATTEMPTS = 8

// error RATE (not raw count) scaled by how much data we actually have on that key,
// so a key typed 10 times with 50% errors outranks one typed 200 times with 5% errors.
const weakScores = (profile: Profile) => Object.fromEntries(
  Object.entries(profile.keyStats).map(([letter, stat]) => {
    const rate = stat.attempts > 0 ? stat.errors / stat.attempts : 0
    const confidence = Math.min(1, stat.attempts / CONFIDENCE_ATTEMPTS)
    return [letter, rate * confidence]
  })
)

const unlockStages = ['анолрмстид', 'үөуег', 'хбвйыц', 'жэзчш', 'пфкъьёюя']
const unlockedLetters = (profile: Profile) => {
  const recent = profile.lessons.slice(-5)
  const recentAccuracy = recent.length ? recent.reduce((sum, lesson) => sum + lesson.accuracy, 0) / recent.length : 0
  const level = Math.min(unlockStages.length - 1, Math.floor(profile.lessons.length / 7) + (recent.length >= 4 && recentAccuracy >= 92 ? 1 : 0))
  return { level, letters: unlockStages.slice(0, level + 1).join('').split('') }
}

// Least-squares slope of a series of y-values against their index (0,1,2,...).
// More stable than "last minus first" since it uses every point, not just the endpoints.
function trendSlope(values: number[]): number {
  const n = values.length
  if (n < 2) return 0
  const xMean = (n - 1) / 2
  const yMean = values.reduce((sum, y) => sum + y, 0) / n
  let numerator = 0
  let denominator = 0
  values.forEach((y, x) => {
    numerator += (x - xMean) * (y - yMean)
    denominator += (x - xMean) ** 2
  })
  return denominator ? numerator / denominator : 0
}

function loadProfile(): Profile {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return { ...emptyProfile, ...parsed, keyStats: parsed.keyStats ?? {} }
  } catch { return emptyProfile }
}

function initialState() {
  const profile = loadProfile()
  const target = generatePracticeText(weakScores(profile), 27, unlockedLetters(profile).letters)
  return { profile, target }
}

export function useTyping() {
  const initial = useRef(initialState()).current
  const [profile, setProfile] = useState<Profile>(initial.profile)
  const [target, setTarget] = useState(initial.target)
  const [typed, setTyped] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [saved, setSaved] = useState(false)
  const lessonStats = useRef<Record<string, KeyStat>>({})

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)) }, [profile])
  useEffect(() => {
    if (!startedAt || typed.length >= target.length) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [startedAt, typed.length, target.length])

  const stats = useMemo(() => {
    const elapsed = startedAt ? Math.max(0, (now - startedAt) / 1000) : 0
    const correct = typed.split('').filter((char, i) => char === target[i]).length
    const accuracy = typed.length ? Math.round((correct / typed.length) * 100) : 100
    const wpm = elapsed >= 1 ? Math.round((correct / 5) / (elapsed / 60)) : 0
    return { elapsed, correct, accuracy, wpm, isComplete: typed.length === target.length }
  }, [typed, target, startedAt, now])

  useEffect(() => {
    if (!stats.isComplete || !startedAt || saved) return
    const lesson = { date: getDate(), wpm: stats.wpm, accuracy: stats.accuracy, seconds: Math.max(1, Math.round(stats.elapsed)) }
    setProfile(current => {
      // Decay existing key stats first so old data slowly loses weight,
      // then fold in this lesson's fresh (undecayed) attempts.
      const decayed = Object.entries(current.keyStats).reduce<Record<string, KeyStat>>((all, [letter, stat]) => ({
        ...all,
        [letter]: {
          attempts: stat.attempts * KEY_STAT_DECAY,
          errors: stat.errors * KEY_STAT_DECAY,
          correct: stat.correct * KEY_STAT_DECAY
        }
      }), {})
      const mergedKeyStats = Object.entries(lessonStats.current).reduce<Record<string, KeyStat>>((all, [letter, stat]) => ({
        ...all,
        [letter]: {
          attempts: (all[letter]?.attempts ?? 0) + stat.attempts,
          errors: (all[letter]?.errors ?? 0) + stat.errors,
          correct: (all[letter]?.correct ?? 0) + stat.correct
        }
      }), decayed)
      return {
        lessons: [...current.lessons, lesson].slice(-120),
        keyStats: mergedKeyStats,
        totalSeconds: current.totalSeconds + lesson.seconds,
        lastPracticeDate: lesson.date
      }
    })
    setSaved(true)
  }, [saved, startedAt, stats, target, typed])

  const reset = useCallback(() => {
    setTarget(generatePracticeText(weakScores(profile), 27, unlockedLetters(profile).letters)); setTyped(''); setStartedAt(null); setNow(Date.now()); setSaved(false); lessonStats.current = {}
  }, [profile])
  const type = useCallback((value: string) => {
    const next = value.slice(0, target.length)
    if (!startedAt && next) setStartedAt(Date.now())
    if (next.length > typed.length) {
      for (let index = typed.length; index < next.length; index++) {
        const expected = target[index]?.toLowerCase()
        if (!expected || expected === ' ') continue
        const previous = lessonStats.current[expected] ?? { attempts: 0, errors: 0, correct: 0 }
        const correct = next[index] === target[index]
        lessonStats.current[expected] = { attempts: previous.attempts + 1, errors: previous.errors + (correct ? 0 : 1), correct: previous.correct + (correct ? 1 : 0) }
      }
    }
    setTyped(next)
  }, [startedAt, target, typed])

  const history = profile.lessons
  const recent = history.slice(-5)
  const learningRate = Math.round(trendSlope(recent.map(lesson => lesson.wpm)) * 10) / 10
  const todaySeconds = history.filter(lesson => lesson.date === getDate()).reduce((sum, lesson) => sum + lesson.seconds, 0)
  const weakLetters = Object.entries(profile.keyStats).map(([letter, stat]) => [letter, stat.errors / Math.max(1, stat.attempts)] as const).filter(([, rate]) => rate > 0).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const progression = unlockedLetters(profile)
  const nextUnlock = unlockStages[progression.level + 1]?.split('').map(letter => letter.toUpperCase()).join(' · ') ?? null
  return { target, typed, type, reset, stats, profile, learningRate, todaySeconds, weakLetters, saved, lessonLevel: progression.level + 1, nextUnlock }
}