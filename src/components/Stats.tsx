type Props = { wpm: number; accuracy: number; elapsed: number }
const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
export function Stats({ wpm, accuracy, elapsed }: Props) {
  return <section className="stats" aria-label="Typing statistics">
    <div><span>Speed</span><strong>{wpm}</strong><small>WPM</small></div>
    <div><span>Accuracy</span><strong>{accuracy}</strong><small>%</small></div>
    <div><span>Time</span><strong>{formatTime(elapsed)}</strong><small>MIN</small></div>
  </section>
}
