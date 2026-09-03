import { useEffect, useRef } from 'react'
type Props = { target: string; typed: string; onType: (value: string) => void; complete: boolean; active: boolean; onActivate: () => void }
export function TypingArea({ target, typed, onType, complete, active, onActivate }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { if (active) inputRef.current?.focus() }, [active])
  const activate = () => { onActivate(); requestAnimationFrame(() => inputRef.current?.focus()) }
  return <section className={`practice ${active ? 'is-active' : ''}`} onClick={activate}>
    <textarea ref={inputRef} value={typed} onChange={e => onType(e.target.value)} onFocus={activate} aria-label="Type the Mongolian text" spellCheck={false} autoCapitalize="off" autoComplete="off" />
    <p className="practice-copy" aria-hidden="true">
      {target.split('').map((char, i) => {
        const state = i < typed.length ? (typed[i] === char ? 'correct' : 'incorrect') : 'pending'
        return <span className={state} key={i}>{i === typed.length && <i className="caret" />}{char}</span>
      })}
    </p>
    {!active && <button className="activation" type="button" onClick={activate}><b>Дасгалыг эхлүүлэх</b><span>Энд дарна уу эсвэл Enter товч дарна уу</span></button>}
    {complete && <div className="complete">Сайн байна! Дараагийн дасгалыг эхлүүлээрэй.</div>}
  </section>
}
