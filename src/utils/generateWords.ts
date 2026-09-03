import { mongolianWords } from '../data/words'

const beginnerWords = ['ном', 'мал', 'тал', 'сал', 'сон', 'орон', 'олон', 'амар', 'мол', 'сурал', 'сонин', 'мод', 'од', 'сар', 'нар', 'санал', 'намар', 'марал', 'самар', 'далан', 'дотор', 'долоо', 'арван', 'арслан', 'мөн', 'санам', 'номлол', 'маргаан', 'талан', 'далай']

const CYRILLIC_LETTER = /[а-яөүё]/i
const MAX_WEAK_LETTERS = 6
const WEAK_LETTER_WEIGHT = 7
const RECENT_WINDOW = 8

function fitsAllowed(word: string, allowed: Set<string> | null): boolean {
  if (!allowed) return true
  return word.toLowerCase().split('').every(char => char === ' ' || allowed.has(char))
}

export function generatePracticeText(weakLetters: Record<string, number> = {}, wordCount = 27, unlockedLetters?: string[]) {
  const weak = Object.entries(weakLetters)
    .filter(([letter]) => CYRILLIC_LETTER.test(letter))
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_WEAK_LETTERS)
    .map(([letter]) => letter)

  const allowed = unlockedLetters ? new Set(unlockedLetters.map(letter => letter.toLowerCase())) : null

  // The `allowed` constraint must hold at every fallback tier — a learner should
  // never see a letter they haven't unlocked yet, even when the main pool is thin.
  const candidatePool = [...mongolianWords, ...beginnerWords].filter(word => fitsAllowed(word, allowed))
  const fallbackPool = beginnerWords.filter(word => fitsAllowed(word, allowed))
  const source = candidatePool.length >= 5 ? candidatePool : (fallbackPool.length ? fallbackPool : beginnerWords)

  const weightOf = (word: string) => 1 + weak.reduce(
    (total, letter) => total + (word.toLowerCase().split(letter).length - 1) * WEAK_LETTER_WEIGHT,
    0
  )
  const weightedWords = source.flatMap(word => Array.from({ length: weightOf(word) }, () => word))
  const pool = weightedWords.length ? weightedWords : source

  // Clamp the anti-repeat window to what the source can actually support, so a
  // tiny word list (e.g. level 1 with one unlocked letter) can never lock up
  // the picker by excluding every available word.
  const uniqueCount = new Set(source).size
  const windowSize = Math.max(0, Math.min(RECENT_WINDOW, uniqueCount - 1))

  const words: string[] = []
  const recentOrder: string[] = []
  const recentSet = new Set<string>()

  for (let i = 0; i < wordCount; i++) {
    const last = words.at(-1)
    let choices = pool.filter(word => word !== last && !recentSet.has(word))
    if (!choices.length) choices = pool.filter(word => word !== last)
    if (!choices.length) choices = pool

    const next = choices[Math.floor(Math.random() * choices.length)]
    words.push(next)

    recentOrder.push(next)
    recentSet.add(next)
    if (recentOrder.length > windowSize) {
      const dropped = recentOrder.shift()!
      // Only forget it once nothing else still in the window needs it.
      if (!recentOrder.includes(dropped)) recentSet.delete(dropped)
    }
  }

  return words.join(' ')
}