import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { contact, projects } from './content'
import SkillUniverse from './SkillUniverse'
import ProjectDetail from './ProjectDetail'

const Scene = lazy(() => import('./Scene'))

function readProjectId() {
  const projectId = new URLSearchParams(window.location.search).get('project')
  return projects.some(project => project.id === projectId) ? projectId : null
}

function webGLAvailable() {
  try {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(pointer: coarse)').matches || connection?.saveData) return false
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (context) context.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(context)
  } catch { return false }
}

export default function App() {
  const [webgl, setWebgl] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [finePointer, setFinePointer] = useState(false)
  const [sceneInView, setSceneInView] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [cursor, setCursor] = useState({ visible: false, mode: 'off' })
  const [activeProjectId, setActiveProjectId] = useState(readProjectId)
  const pointerRef = useRef({ x: 0, y: 0 })
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorModeRef = useRef('off')
  const cursorVisibleRef = useRef(false)
  const heroArtRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const syncProjectRoute = () => {
      const projectId = readProjectId()
      const params = new URLSearchParams(window.location.search)
      if (params.has('project') && !projectId) {
        params.delete('project')
        const query = params.size ? `?${params}` : ''
        window.history.replaceState({}, '', `${window.location.pathname}${query}${window.location.hash}`)
      }
      setActiveProjectId(projectId)
    }
    window.addEventListener('popstate', syncProjectRoute)
    syncProjectRoute()
    if (window.location.hash && window.location.hash !== '#home') {
      const target = document.getElementById(window.location.hash.slice(1))
      if (target) window.requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant' }))
    }
    const hasHeroScene = Boolean(document.querySelector('.hero'))
    const canRenderScene = hasHeroScene && webGLAvailable()
    let allowSceneLoad = !window.location.hash || window.location.hash === '#home'
    if (canRenderScene && allowSceneLoad) setWebgl(true)
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    setFinePointer(hasFinePointer)
    if (hasFinePointer) document.body.classList.add('has-custom-pointer')
    const onScroll = () => setScrolled(window.scrollY > 28)
    const onMove = (event: PointerEvent) => {
      const x = (event.clientX / innerWidth - .5) * 2
      const y = (event.clientY / innerHeight - .5) * 2
      pointerRef.current.x = x
      pointerRef.current.y = y
      if (heroArtRef.current) {
        heroArtRef.current.dataset.pointerX = x.toFixed(2)
        heroArtRef.current.dataset.pointerY = y.toFixed(2)
      }
      if (event.pointerType !== 'touch') {
        const target = event.target instanceof Element ? event.target : null
        const inProject = target?.closest('.project-visual')
        const inSkillSpace = target?.closest('.skill-stage')
        const mode = inProject ? 'explore' : target?.closest('a, button') ? 'interactive' : inSkillSpace ? 'default' : 'off'
        cursorRef.current?.style.setProperty('--cursor-x', `${event.clientX}px`)
        cursorRef.current?.style.setProperty('--cursor-y', `${event.clientY}px`)
        if (cursorModeRef.current !== mode) {
          cursorModeRef.current = mode
          setCursor(current => ({ ...current, mode }))
        }
        if (!cursorVisibleRef.current) {
          cursorVisibleRef.current = true
          setCursor(current => ({ ...current, visible: true }))
        }
      }
    }
    const onPointerLeave = () => {
      cursorVisibleRef.current = false
      setCursor(current => ({ ...current, visible: false }))
    }
    const sceneObserver = new IntersectionObserver(entries => {
      const isInView = Boolean(entries[0]?.isIntersecting)
      if (!isInView) {
        allowSceneLoad = true
        setSceneInView(false)
        setSceneReady(false)
        return
      }
      if (!allowSceneLoad) return
      setSceneInView(true)
      if (canRenderScene) setWebgl(true)
    }, { rootMargin: '0px' })
    const heroElement = hasHeroScene ? document.querySelector('.hero') : null
    if (heroElement) sceneObserver.observe(heroElement)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let animationsCancelled = false
    let revertAnimations = () => {}
    const initializeAnimations = async () => {
      if (reduceMotion) return
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      if (animationsCancelled) return
      gsap.registerPlugin(ScrollTrigger)
      const animationContext = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('[data-reveal]:not(.project)').forEach(element => {
          gsap.fromTo(element, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .75, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 89%', once: true } })
        })
        gsap.utils.toArray<HTMLElement>('.project').forEach(project => {
          const visual = project.querySelector('.project-visual')
          const info = project.querySelector('.project-info')
          const reveal = gsap.timeline({ scrollTrigger: { trigger: project, start: 'top 77%', once: true } })
          if (visual) reveal.fromTo(visual, { clipPath: 'inset(0 0 14% 0)', scale: .97, opacity: 0 }, { clipPath: 'inset(0 0 0 0)', scale: 1, opacity: 1, duration: .9, ease: 'power3.out' })
          if (info) reveal.fromTo(info, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .65, ease: 'power2.out' }, '-=.43')
        })
      })
      revertAnimations = () => animationContext.revert()
    }
    void initializeAnimations().catch(() => {
      // All sections remain visible when the optional motion chunk cannot load.
    })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onPointerLeave)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onPointerLeave)
      animationsCancelled = true
      revertAnimations()
      sceneObserver.disconnect()
      document.body.classList.remove('has-custom-pointer')
      window.removeEventListener('popstate', syncProjectRoute)
    }
  }, [])

  const closeMenu = () => setMenuOpen(false)
  const markSceneReady = () => setSceneReady(true)
  const activeProject = projects.find(project => project.id === activeProjectId)
  const openProject = (projectId: string) => {
    window.history.pushState({}, '', `${window.location.pathname}?project=${projectId}`)
    setActiveProjectId(projectId)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const returnToWork = () => {
    window.history.replaceState({}, '', `${window.location.pathname}#work`)
    setActiveProjectId(null)
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      document.querySelector('#work')?.scrollIntoView({ behavior: 'instant' })
      if (activeProjectId) document.querySelector<HTMLButtonElement>(`#project-${activeProjectId} .project-detail-link`)?.focus({ preventScroll: true })
    }))
  }
  if (activeProject) return <ProjectDetail project={activeProject} onReturn={returnToWork} />

  return <main className="page-shell">
    <div className="grain" aria-hidden="true" />
    <header className={`topbar ${scrolled ? 'topbar--scrolled' : ''}`} onKeyDown={event => {
      if (event.key === 'Escape' && menuOpen) {
        setMenuOpen(false)
        document.getElementById('menu-toggle')?.focus()
      }
    }}>
      <a className="wordmark" href="#home" aria-label="Nexus, home">N<span>·</span>X</a>
      <a className="topbar-note" href="#contact"><span className="availability-dot" /> AVAILABLE FOR SELECT PROJECTS</a>
      <button id="menu-toggle" className={`menu-toggle ${menuOpen ? 'is-open' : ''}`} type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="site-menu" onClick={() => setMenuOpen(!menuOpen)}>
        <span>{menuOpen ? 'CLOSE' : 'MENU'}</span><i aria-hidden="true" />
      </button>
      <nav id="site-menu" className={`menu-panel ${menuOpen ? 'menu-panel--open' : ''}`} aria-label="Main navigation" aria-hidden={!menuOpen}>
        <a href="#about" onClick={closeMenu}><span>01</span> About <b>↗</b></a>
        <a href="#work" onClick={closeMenu}><span>02</span> Selected work <b>↗</b></a>
        <a href="#expertise" onClick={closeMenu}><span>03</span> Expertise <b>↗</b></a>
        <a href="#approach" onClick={closeMenu}><span>04</span> Approach <b>↗</b></a>
        <a href="#contact" onClick={closeMenu}><span>05</span> Contact <b>↗</b></a>
        <p>INDEPENDENT BY DESIGN<br />CONNECTED BY CURIOSITY.</p>
      </nav>
    </header>

    <section id="home" className="hero" aria-labelledby="hero-title">
      <div className="hero-index"><span>INDEPENDENT DIGITAL PRACTICE</span><span>EST. 2025&nbsp; / &nbsp;IN&nbsp;—&nbsp;01</span></div>
      <div className={`hero-art ${sceneReady ? 'hero-art--scene-ready' : ''}`} ref={heroArtRef} data-pointer-x="0.00" data-pointer-y="0.00" aria-hidden="true">
        <div className="art-aura" />
        <div className="fallback-sculpture"><div className="fallback-loop fallback-loop--one" /><div className="fallback-loop fallback-loop--two" /><div className="fallback-core" /></div>
        {webgl && sceneInView && <Suspense fallback={null}><Scene pointerRef={pointerRef} finePointer={finePointer} onReady={markSceneReady} /></Suspense>}
        <span className="art-caption">FIG. 01 &nbsp;—&nbsp; THE CONNECTION</span>
        <span className="art-coordinate">37° 33′ 59″ N<br />126° 58′ 41″ E</span>
      </div>
      <div className="hero-copy">
        <h1 id="hero-title"><span className="title-line title-line--one">DIGITAL</span><span className="title-line title-line--two">MATTER<span className="title-period">.</span></span></h1>
        <div className="hero-bottom">
          <p className="hero-role">FRONTEND DEVELOPER<br /><span>CREATIVE DEVELOPER</span></p>
          <p className="hero-statement">I shape the space where<br />design meets technology.</p>
          <a className="scroll-cue" href="#about"><span>SCROLL TO EXPLORE</span><i aria-hidden="true">↓</i></a>
        </div>
      </div>
      <div className="side-label" aria-hidden="true">A STUDY IN FORM&nbsp; · &nbsp;A STUDY IN FLOW</div>
    </section>

    <section id="about" className="about-section content-section" aria-labelledby="about-title">
      <div className="section-kicker" data-reveal><span>01 / A POINT OF VIEW</span><span>DESIGN × CODE × INTERACTION</span></div>
      <div className="about-composition">
        <h2 id="about-title" data-reveal>I make the digital<br />feel <em>tangible.</em></h2>
        <div className="about-orbit" aria-hidden="true" data-reveal>
          <span className="orbit orbit--outer" /><span className="orbit orbit--middle" /><span className="orbit orbit--inner" />
          <i className="orbit-core" /><b className="orbit-label orbit-label--one">DESIGN</b><b className="orbit-label orbit-label--two">CODE</b><b className="orbit-label orbit-label--three">FEEL</b>
        </div>
      </div>
      <div className="about-bottom" data-reveal>
        <span className="about-mark">N<span>·</span>X&nbsp; / &nbsp;INDEPENDENT PRACTICE</span>
        <p>I’m a frontend developer drawn to the meeting point of visual clarity and expressive technology. I bring design and engineering into the same conversation, shaping interfaces that feel considered from the first frame to the smallest response.</p>
      </div>
    </section>

    <section id="work" className="work-section content-section" aria-labelledby="work-title">
      <div className="section-kicker" data-reveal><span>02 / SELECTED WORK</span><span>THREE WORLDS, BUILT WITH INTENTION</span></div>
      <div className="work-heading" data-reveal><h2 id="work-title">Built to be<br /><em>experienced.</em></h2><p>Each project begins with a distinct point of view, then finds its form in the details of interaction.</p></div>
      <div className="project-list">
        {projects.map((project, index) => <article className={`project project--${project.id}`} id={`project-${project.id}`} key={project.id} data-reveal>
          <div className={`project-visual project-visual--${project.id}`}>
            <div className="visual-grain" />
            <picture className="project-image-frame">
              <source media="(max-width: 760px)" srcSet={project.mobileImage} />
              <img src={project.image} alt={project.imageAlt} width="1440" height="900" loading="lazy" decoding="async" />
            </picture>
            <span className="project-index">0{index + 1}</span>
          </div>
          <div className="project-info">
            <div className="project-title-row"><div><span className="project-category">{project.category}</span><h3>{project.name}</h3></div><span className="project-type">LIVE EXPERIENCE</span></div>
            <p className="project-description">{project.description}</p>
            <div className="project-meta"><div className="capability-list"><span className="meta-label">VERIFIED FOCUS</span>{project.capabilities.map(capability => <span className="capability" key={capability}>{capability}</span>)}</div><div className="technology-list"><span className="meta-label">PUBLICLY IDENTIFIED TECHNOLOGY</span><div>{project.technologies.length ? project.technologies.map(technology => <span className="technology" key={technology}>{technology}</span>) : <span className="technology-note">Not disclosed on the live site</span>}</div></div></div>
            <div className="project-action"><button className="text-link project-detail-link" type="button" onClick={() => openProject(project.id)}>EXPLORE PROJECT <span>↗</span></button><a className="text-link" href={project.link} target="_blank" rel="noreferrer">LIVE PROJECT <span>↗</span></a></div>
          </div>
        </article>)}
      </div>
    </section>

    <section id="expertise" className="expertise-section content-section" aria-labelledby="expertise-title">
      <div className="section-kicker" data-reveal><span>03 / EXPERTISE</span><span>TOOLS IN SERVICE OF THE EXPERIENCE</span></div>
      <div className="expertise-intro" data-reveal><h2 id="expertise-title">Fluent in<br /><em>the front end.</em></h2><p>A versatile practice across the visual, technical, and human sides of the browser.</p></div>
      <SkillUniverse />
    </section>

    <section id="approach" className="approach-section content-section" aria-labelledby="approach-title">
      <div className="section-kicker" data-reveal><span>04 / DEVELOPMENT PHILOSOPHY</span><span>HOW IT COMES TOGETHER</span></div>
      <div className="approach-heading" data-reveal><h2 id="approach-title">Considered<br />at every <em>layer.</em></h2><p>The best experiences feel effortless because every decision has been made with care.</p></div>
      <div className="principles">
        <article data-reveal><span>01 / VISUALS</span><h3>See the detail.</h3><p>Composition, contrast, rhythm, and restraint give an interface its character. The small decisions add up to a clear point of view.</p></article>
        <article data-reveal><span>02 / ENGINEERING</span><h3>Make it hold.</h3><p>Thoughtful structure makes creative work dependable. Components stay understandable, flexible, and ready to grow with the experience.</p></article>
        <article data-reveal><span>03 / PERFORMANCE</span><h3>Keep it light.</h3><p>Motion and visual depth earn their place. Efficient rendering, responsive layouts, and accessibility belong in the design from the start.</p></article>
        <article data-reveal><span>04 / INTERACTION</span><h3>Give it a pulse.</h3><p>Every response should feel intentional. A transition, hover, or reveal can guide attention without asking the user to wait.</p></article>
      </div>
    </section>

    <section id="contact" className="contact-section content-section" aria-labelledby="contact-title">
      <div className="contact-orbit" aria-hidden="true"><span/><i/><b/></div>
      <div className="section-kicker" data-reveal><span>05 / OPEN CHANNEL</span><span>GOOD WORK STARTS WITH A CONVERSATION</span></div>
      <div className="contact-content" data-reveal><p className="contact-pretitle">HAVE A GOOD QUESTION OR AN AMBITIOUS IDEA?</p><h2 id="contact-title">Let’s make<br />something <em>matter.</em></h2><a className="contact-email" href={`mailto:${contact.email}`}>{contact.email}<span>↗</span></a><span className="editable-note">EDITABLE EMAIL PLACEHOLDER</span></div>
      <div className="social-row" data-reveal><span className="meta-label">ELSEWHERE</span><div>{contact.social.map(social => social.href ? <a className="social-placeholder" href={social.href} key={social.label} target="_blank" rel="noreferrer">{social.label} ↗</a> : <span className="social-placeholder social-placeholder--pending" key={social.label}>{social.label} ↗ <small>LINK PENDING</small></span>)}</div></div>
      <footer className="site-footer"><a className="footer-mark" href="#home">N<span>·</span>X</a><span>INDEPENDENT DIGITAL PRACTICE&nbsp; / &nbsp;2025—26</span><a href="#home">BACK TO THE BEGINNING ↑</a></footer>
    </section>

    {finePointer && <div ref={cursorRef} className={`nexus-cursor nexus-cursor--${cursor.mode} ${cursor.visible ? 'is-visible' : ''}`} aria-hidden="true">{cursor.mode === 'explore' ? 'EXPLORE' : cursor.mode === 'interactive' ? 'OPEN' : <i />}</div>}
  </main>
}
