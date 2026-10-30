import { useMemo, useState, type CSSProperties, type PointerEvent } from 'react'

const skillData = [
  { name: 'React', group: 'Interface systems', x: 27, y: 30, note: 'Composing reusable interfaces around the way people think and work.' },
  { name: 'TypeScript', group: 'Interface systems', x: 43, y: 17, note: 'Making complex interfaces easier to reason about and evolve.' },
  { name: 'JavaScript', group: 'Interface systems', x: 25, y: 53, note: 'Giving interfaces behavior, feedback, and a little life.' },
  { name: 'HTML', group: 'Interface systems', x: 36, y: 75, note: 'Building meaningful structure that works across devices and assistive technology.' },
  { name: 'CSS', group: 'Interface systems', x: 53, y: 79, note: 'Shaping clear, adaptable visual systems in the browser.' },
  { name: 'Three.js', group: 'Space & motion', x: 71, y: 28, note: 'Creating purposeful depth and spatial moments for the web.' },
  { name: 'GSAP', group: 'Space & motion', x: 81, y: 48, note: 'Choreographing motion that supports a story and respects its pace.' },
  { name: 'Responsive Design', group: 'Experience quality', x: 75, y: 73, note: 'Making composition and interaction feel native at every size.' },
  { name: 'Accessibility', group: 'Experience quality', x: 18, y: 76, note: 'Keeping the experience understandable and usable for more people.' },
  { name: 'Performance Optimization', group: 'Experience quality', x: 9, y: 42, note: 'Keeping interfaces quick to render and light to explore.' },
]

const groups = ['All disciplines', 'Interface systems', 'Space & motion', 'Experience quality']

export default function SkillUniverse() {
  const [activeGroup, setActiveGroup] = useState('All disciplines')
  const [activeSkill, setActiveSkill] = useState<string | null>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const active = skillData.find(skill => skill.name === activeSkill)
  const visible = useMemo(() => skillData.filter(skill => activeGroup === 'All disciplines' || skill.group === activeGroup), [activeGroup])

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const bounds = event.currentTarget.getBoundingClientRect()
    setTilt({ x: ((event.clientY - bounds.top) / bounds.height - .5) * -5, y: ((event.clientX - bounds.left) / bounds.width - .5) * 7 })
  }
  const resetTilt = () => setTilt({ x: 0, y: 0 })

  return <div className="skill-universe" role="region" aria-label="Interactive frontend skill universe">
    <div className="skill-controls" role="group" aria-label="Filter skills by discipline">
      {groups.map(group => <button type="button" key={group} aria-pressed={activeGroup === group} className={activeGroup === group ? 'is-selected' : ''} onClick={() => { setActiveGroup(group); if (activeSkill && !skillData.some(skill => skill.name === activeSkill && (group === 'All disciplines' || skill.group === group))) setActiveSkill(null) }}>{group}</button>)}
    </div>
    <div className="skill-stage" onPointerMove={onPointerMove} onPointerLeave={resetTilt}>
      <div className="skill-space" style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
        <svg className="skill-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {visible.map(skill => <line key={skill.name} x1="50" y1="50" x2={skill.x} y2={skill.y} className={activeSkill === skill.name ? 'line-active' : ''} />)}
          <circle cx="50" cy="50" r="1.1" />
        </svg>
        <div className="skill-core" aria-hidden="true"><span className="core-ring core-ring--a"/><span className="core-ring core-ring--b"/><span className="core-ring core-ring--c"/><i/><b>N</b></div>
        <span className="skill-group-label group-label--systems">INTERFACE SYSTEMS</span>
        <span className="skill-group-label group-label--motion">SPACE & MOTION</span>
        <span className="skill-group-label group-label--quality">EXPERIENCE QUALITY</span>
        {visible.map((skill, index) => <button key={skill.name} type="button" className={`skill-node ${skill.x > 60 ? 'skill-node--left-label' : ''} ${skill.name === 'Performance Optimization' ? 'skill-node--edge-left' : ''} ${activeSkill === skill.name ? 'is-active' : ''} ${activeGroup !== 'All disciplines' ? 'group-active' : ''}`} style={{ left: `${skill.x}%`, top: `${skill.y}%`, '--node-index': index } as CSSProperties} aria-pressed={activeSkill === skill.name} onClick={() => setActiveSkill(activeSkill === skill.name ? null : skill.name)}>
          <span className="node-light" aria-hidden="true"/><span className="node-label">{skill.name}</span>
        </button>)}
      </div>
    </div>
    <div className="skill-reading" aria-live="polite" aria-atomic="true">
      <span className="skill-reading-index">{active ? active.group.toUpperCase() : 'A CONNECTED PRACTICE'}</span>
      <p>{active ? <><strong>{active.name}.</strong> {active.note}</> : <>Select a point to explore it. The disciplines connect through one shared surface: the browser.</>}</p>
      <span className="skill-reading-mark">{active ? '01 / 01' : '10 / 10'}</span>
    </div>
  </div>
}
