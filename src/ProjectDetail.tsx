import { useEffect, useRef, type CSSProperties } from 'react'

type Project = {
  id: string
  name: string
  category: string
  description: string
  overview: string
  role: string
  capabilities: string[]
  technologies: string[]
  image: string
  mobileImage: string
  imageAlt: string
  mobileImageAlt: string
  accent: string
  link: string
}

type ProjectDetailProps = {
  project: Project
  onReturn: () => void
}

export default function ProjectDetail({ project, onReturn }: ProjectDetailProps) {
  const style = { '--project-accent': project.accent } as CSSProperties
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
    const originalTitle = document.title
    const updateMeta = (selector: string, value: string) => {
      const element = document.querySelector<HTMLMetaElement>(selector)
      if (!element) return () => {}
      const previous = element.content
      element.content = value
      return () => { element.content = previous }
    }
    document.title = `${project.name} \u2014 NEXUS`
    const restoreMeta = [
      updateMeta('meta[name=description]', project.description),
      updateMeta('meta[property="og:title"]', `${project.name} \u2014 NEXUS`),
      updateMeta('meta[property="og:description"]', project.description),
      updateMeta('meta[property="og:image"]', project.image),
      updateMeta('meta[property="og:image:width"]', '1440'),
      updateMeta('meta[property="og:image:height"]', '900'),
      updateMeta('meta[property="og:image:alt"]', project.imageAlt),
      updateMeta('meta[name="twitter:title"]', `${project.name} \u2014 NEXUS`),
      updateMeta('meta[name="twitter:description"]', project.description),
      updateMeta('meta[name="twitter:image"]', project.image),
      updateMeta('meta[name="twitter:image:alt"]', project.imageAlt),
    ]
    return () => {
      document.title = originalTitle
      restoreMeta.forEach(restore => restore())
    }
  }, [project.description, project.image, project.imageAlt, project.id, project.name])

  return <main className={`project-detail project-detail--${project.id}`} style={style}>
    <div className="grain" aria-hidden="true" />
    <header className="detail-topbar">
      <a className="wordmark" href="/#home" aria-label="Nexus, home">N<span>·</span>X</a>
      <span className="detail-topbar-label">PROJECT STUDY&nbsp; / &nbsp;{project.category}</span>
      <button className="detail-return" type="button" onClick={onReturn}>RETURN TO WORK <span aria-hidden="true">↗</span></button>
    </header>

    <div className="detail-content">
      <div className="detail-intro" data-reveal>
        <span className="detail-kicker">SELECTED WORK&nbsp; / &nbsp;0{['velora', 'aether', 'orve'].indexOf(project.id) + 1}</span>
        <h1 ref={headingRef} tabIndex={-1}>{project.name}</h1>
        <p>{project.description}</p>
      </div>

      <figure className="detail-desktop-image" data-reveal>
        <img src={project.image} alt={project.imageAlt} width="1440" height="900" fetchPriority="high" decoding="async" />
        <figcaption><span>LIVE EXPERIENCE&nbsp; / &nbsp;DESKTOP VIEW</span><span>1440 × 900</span></figcaption>
      </figure>

      <div className="detail-story" data-reveal>
        <div><span className="detail-kicker">THE PROJECT</span><h2>An experience shaped<br />around <em>its purpose.</em></h2></div>
        <p>{project.overview}</p>
      </div>

      <div className="detail-evidence" data-reveal>
        <figure className="detail-mobile-image">
          <img src={project.mobileImage} alt={project.mobileImageAlt} width="390" height="844" loading="lazy" decoding="async" />
          <figcaption>MOBILE VIEW&nbsp; / &nbsp;390 × 844</figcaption>
        </figure>
        <div className="detail-facts">
          <div><span className="detail-kicker">ROLE</span><p>{project.role}</p></div>
          <div><span className="detail-kicker">VERIFIED FOCUS</span><ul>{project.capabilities.map(item => <li key={item}>{item}</li>)}</ul></div>
          <div><span className="detail-kicker">PUBLICLY IDENTIFIED TECHNOLOGY</span>{project.technologies.length ? <div className="detail-tech">{project.technologies.map(item => <span key={item}>{item}</span>)}</div> : <p>Not disclosed on the live site.</p>}</div>
        </div>
      </div>

      <div className="detail-end" data-reveal>
        <span className="detail-kicker">CONTINUE EXPLORING</span>
        <button className="detail-return detail-return--large" type="button" onClick={onReturn}>Back to selected work <span aria-hidden="true">↗</span></button>
        <a className="detail-live-link" href={project.link} target="_blank" rel="noreferrer">VISIT THE LIVE PROJECT <span aria-hidden="true">↗</span></a>
      </div>
    </div>

    <footer className="detail-footer"><a className="footer-mark" href="/#home">N<span>·</span>X</a><span>PROJECT STUDY&nbsp; / &nbsp;NEXUS</span><button type="button" onClick={onReturn}>RETURN TO WORK ↑</button></footer>
  </main>
}

