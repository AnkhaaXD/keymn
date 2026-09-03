import { keyboardRows, specialKeyLabels } from '../utils/keyboard'
type Props = { activeKey: string | null; nextKey?: string | null }
const fingers: Record<string, string> = {
  'ф': 'pinky', 'ц': 'ring', 'у': 'middle', 'ж': 'index', 'э': 'index', 'н': 'index', 'г': 'index', 'ш': 'index', 'ү': 'index', 'з': 'middle', 'к': 'ring', 'ъ': 'pinky',
  'й': 'pinky', 'ы': 'ring', 'б': 'middle', 'ө': 'index', 'а': 'index', 'х': 'index', 'р': 'index', 'о': 'index', 'л': 'middle', 'д': 'ring', 'п': 'pinky',
  'я': 'pinky', 'ч': 'ring', 'ё': 'middle', 'с': 'index', 'м': 'index', 'и': 'index', 'т': 'index', 'ь': 'index', 'в': 'middle', 'ю': 'ring'
}
export function Keyboard({ activeKey, nextKey = null }: Props) {
  return <section className="keyboard" aria-label="Mongolian keyboard">
    {keyboardRows.map((row, rowIndex) => <div className="key-row" key={rowIndex}>
      {row.map((key, keyIndex) => <div key={`${key}-${keyIndex}`} className={`key ${specialKeyLabels[key] ? `key-${key}` : ''} ${fingers[key] ? `finger-${fingers[key]}` : ''} ${nextKey === key ? 'next' : ''} ${activeKey === key || (key === 'space' && activeKey === ' ') ? 'active' : ''}`}>
        {specialKeyLabels[key] ?? key.toUpperCase()}
      </div>)}
    </div>)}
  </section>
}
