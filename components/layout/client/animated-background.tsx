import { Compass, Leaf, Plane, Sun } from 'lucide-react'

const FLOATERS = [
  { Icon: Leaf, left: '8%', size: 28, delay: '0s', duration: '38s' },
  { Icon: Compass, left: '27%', size: 22, delay: '-12s', duration: '46s' },
  { Icon: Plane, left: '52%', size: 26, delay: '-25s', duration: '42s' },
  { Icon: Sun, left: '74%', size: 30, delay: '-6s', duration: '50s' },
  { Icon: Leaf, left: '90%', size: 20, delay: '-32s', duration: '36s' },
]

export default function AnimatedBackground() {
  return (
    <div className="page-bg" aria-hidden>
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      {FLOATERS.map(({ Icon, left, size, delay, duration }, i) => (
        <span
          key={i}
          className="leaf"
          style={{ left, animationDelay: delay, animationDuration: duration }}
        >
          <Icon width={size} height={size} />
        </span>
      ))}
    </div>
  )
}
