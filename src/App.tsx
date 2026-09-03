import { useEffect, useMemo, useState } from 'react'
import { Keyboard } from './components/Keyboard'
import { TypingArea } from './components/TypingArea'
import { useTyping } from './hooks/useTyping'

const allKeys = 'Ф Ц У Ж Э Н Г Ш Ү З К Й Ы Б Ө А Х Р О Л Д П Я Ч Ё С М И Т Ь В Ю'.split(' ')
type Page = 'practice' | 'profile' | 'help' | 'scores' | 'layouts' | 'settings'
const minutes = (seconds: number) => Math.floor(seconds / 60)
const pageTitle: Record<Page, string> = { practice: 'Дасгал', profile: 'Таны ахиц', help: 'Тусламж', scores: 'Өндөр оноо', layouts: 'Гарны байрлал', settings: 'Тохиргоо' }

export default function App() {
  const { target, typed, type, reset, stats, profile, learningRate, todaySeconds, weakLetters, saved, lessonLevel, nextUnlock } = useTyping()
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [active, setActive] = useState(false)
  const [page, setPage] = useState<Page>('practice')
  const [theme, setTheme] = useState<'keybr' | 'monkeytype'>(() => localStorage.getItem('keymn-theme') === 'monkeytype' ? 'monkeytype' : 'keybr')
  useEffect(() => { localStorage.setItem('keymn-theme', theme) }, [theme])
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && page === 'practice') { event.preventDefault(); reset(); setActive(false); return }
      if (event.key === 'Enter' && page === 'practice' && !active) { event.preventDefault(); setActive(true); return }
      setActiveKey(event.key.toLowerCase())
    }
    const up = () => setActiveKey(null)
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [active, page, reset])
  const choosePage = (next: Page) => { setPage(next); if (next !== 'practice') setActive(false) }
  const newLesson = () => { reset(); setActive(false) }
  const topSpeed = useMemo(() => Math.max(0, ...profile.lessons.map(lesson => lesson.wpm)), [profile.lessons])
  const averageSpeed = useMemo(() => profile.lessons.length ? Math.round(profile.lessons.reduce((sum, lesson) => sum + lesson.wpm, 0) / profile.lessons.length) : 0, [profile.lessons])
  const progress = Math.min(100, todaySeconds / 1800 * 100)
  const currentKey = weakLetters[0]?.[0]?.toUpperCase() ?? 'А'
  const accuracy = profile.lessons.length ? Math.round(profile.lessons.reduce((sum, lesson) => sum + lesson.accuracy, 0) / profile.lessons.length) : 100

  return <div className="app-shell" data-theme={theme}>
    <aside className="side-nav"><button className="profile-button" onClick={() => choosePage('profile')}><span className="profile-mark">KM</span><span className="profile-name">KeyMN</span></button><div className="side-rule" />
      <nav>{([['practice', '⌨', 'Дасгал'], ['profile', '▱', 'Ахиц'], ['help', '?', 'Тусламж'], ['scores', '♕', 'Өндөр оноо'], ['layouts', '▦', 'Гарны байрлал']] as const).map(([id, icon, label]) => <button className={page === id ? 'selected' : ''} onClick={() => choosePage(id)} key={id}>{icon}&nbsp;&nbsp;{label}</button>)}</nav>
      <button className="settings-link" onClick={() => choosePage('settings')}>⚙ &nbsp;Тохиргоо</button><div className="side-foot">Монгол хэл<br />KeyMN v0.3</div>
    </aside>
    <main className="keybr-layout">
      <div className="utility-bar"><span>◉ Монгол кирилл · {pageTitle[page]}</span><div><button onClick={() => choosePage('help')} aria-label="Help">?</button><button onClick={() => choosePage('settings')} aria-label="Settings">⚙</button></div></div>
      {page === 'practice' && <>
        <section className="metrics" aria-label="Таны ахиц">
          <div><b>Үзүүлэлтүүд:</b> <span>Хурд: <strong>{stats.wpm || averageSpeed}.<small>0</small> wpm</strong></span> <span>Нарийвчлал: <strong>{stats.accuracy}.<small>0%</small></strong></span> <span>Оноо: <strong>{profile.lessons.length * 125}</strong></span></div>
          <div className="key-meter"><b>Бүх үсэг:</b>{allKeys.map(letter => <i className={weakLetters.some(([weak]) => weak.toUpperCase() === letter) ? 'needs-work' : ''} key={letter}>{letter}</i>)}</div>
          <div><b>Одоогийн үсэг:</b> <mark>{currentKey}</mark> <span>Сүүлийн хурд: <strong>{stats.wpm || averageSpeed}.<small>0 wpm</small></strong></span> <span>Дээд хурд: <strong>{topSpeed}.<small>0 wpm</small></strong></span> <span>Сурах хурд: <em className={learningRate >= 0 ? 'positive' : 'negative'}>{learningRate >= 0 ? '+' : ''}{learningRate} wpm/lesson</em></span></div>
          <div><b>Сургалтын түвшин:</b> <span>{lessonLevel}-р шат · {nextUnlock ? `${nextUnlock} үсгүүд рүү ойртож байна.` : 'Бүх суурь үсгийг нээсэн байна.'}</span></div>
          <div className="goal"><b>Өдрийн зорилго:</b><span>{minutes(todaySeconds)}/30 минут</span><div className="goal-track"><i style={{ width: `${progress}%` }} /></div><strong>{Math.round(progress)}%</strong></div>
        </section>
        <TypingArea target={target} typed={typed} onType={value => { if (active) type(value) }} complete={stats.isComplete} active={active} onActivate={() => setActive(true)} />
        <div className="lesson-status"><span>{saved ? <><b>✓ Дасгал хадгалагдлаа.</b> {stats.wpm} WPM · {stats.accuracy}% нарийвчлал · Сул үсгүүд дараагийн дасгалд давтагдана.</> : active ? 'Дасгал идэвхтэй. Дараагийн үсэг гар дээр алтлаг хүрээгээр харагдана.' : 'Бичихийн өмнө дасгалыг идэвхжүүлнэ үү.'}</span><button onClick={newLesson}>Шинэ дасгал <b>→</b></button></div>
        <Keyboard activeKey={activeKey} nextKey={active ? target[typed.length]?.toLowerCase() : null} /><p className="hint"><kbd>Enter</kbd> Идэвхжүүлэх · <kbd>Tab</kbd> Дахин эхлүүлэх · Таны ахиц автоматаар хадгалагдана.</p>
      </>}
      {page === 'profile' && <section className="panel"><h1>Таны бичих ахиц</h1><div className="profile-cards"><div><span>Дасгал</span><strong>{profile.lessons.length}</strong></div><div><span>Дундаж хурд</span><strong>{averageSpeed} <small>wpm</small></strong></div><div><span>Дундаж нарийвчлал</span><strong>{accuracy}%</strong></div><div><span>Нийт хугацаа</span><strong>{minutes(profile.totalSeconds)} <small>мин</small></strong></div></div><h2>Сүүлийн дасгалууд</h2><div className="lesson-chart">{profile.lessons.slice(-16).map((lesson, index) => <i key={index} title={`${lesson.wpm} wpm`} style={{ height: `${Math.max(8, Math.min(100, lesson.wpm * 1.5))}%` }} />)}{!profile.lessons.length && <p>Энд таны хурдны график гарах болно.</p>}</div><h2>Давтахад хэрэгтэй үсгүүд</h2><div className="weak-list">{weakLetters.length ? weakLetters.map(([letter, rate]) => <span key={letter}>{letter.toUpperCase()} <small>{Math.round(rate * 100)}% алдаа</small></span>) : <p>Дасгал хийсний дараа үсэг тус бүрийн нарийвчлал харагдана.</p>}</div></section>}
      {page === 'settings' && <section className="panel settings"><h1>Тохиргоо</h1><h2>Өнгөний загвар</h2><label className={theme === 'keybr' ? 'theme-option chosen' : 'theme-option'}><input type="radio" name="theme" checked={theme === 'keybr'} onChange={() => setTheme('keybr')} /><span><b>Keybr</b><small>Даруухан саарал, ногоон өнгө</small></span></label><label className={theme === 'monkeytype' ? 'theme-option chosen' : 'theme-option'}><input type="radio" name="theme" checked={theme === 'monkeytype'} onChange={() => setTheme('monkeytype')} /><span><b>Monkeytype</b><small>Хар суурь, шар өнгийн accent</small></span></label><h2>Өдрийн зорилго</h2><p>Одоогийн зорилго: өдөрт 30 минут. Дасгал бүр дуусахад хугацаа тань автоматаар нэмэгдэнэ.</p></section>}
      {page === 'help' && <section className="panel"><h1>Хэрхэн ашиглах вэ</h1><ol><li><b>Enter</b> товч эсвэл бичвэрийн талбар дээр дарж дасгалыг идэвхжүүлнэ.</li><li>Өгөгдсөн үгийг аль болох зөв бичээрэй.</li><li>Систем таны оролдлого, алдааг үсэг тус бүрээр нь санаж, сул үсгийг дараагийн дасгалд илүү олон давтуулна.</li><li><b>Tab</b> товчоор шинэ дасгал эхлүүлнэ.</li></ol></section>}
      {(page === 'scores' || page === 'layouts') && <section className="panel"><h1>{pageTitle[page]}</h1><p>{page === 'scores' ? 'Өндөр онооны самбар удахгүй нэмэгдэнэ. Одоогоор таны хувийн дээд хурд дээрх “Ахиц” хэсэгт хадгалагдаж байна.' : 'Стандарт Монгол кирилл гар: Ф Ц У Ж Э Н Г Ш Ү З К Ъ / Й Ы Б Ө А Х Р О Л Д П / Я Ч Ё С М И Т Ь В Ю. Өнгөт доод зураас нь санал болгосон хурууны бүсийг, алтлаг хүрээ нь дараагийн үсгийг заана.'}</p>{page === 'layouts' && <Keyboard activeKey={activeKey} nextKey={null} />}</section>}
    </main>
  </div>
}
