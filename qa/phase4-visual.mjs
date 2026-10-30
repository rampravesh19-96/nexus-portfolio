import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const dimensions = [[1440, 900], [768, 1024], [390, 844], [320, 740]]
const report = { viewports: [], links: {}, navigation: {}, reducedMotion: {}, consoleErrors: [], failedRequests: [], details: {} }
await mkdir('qa-screenshots/phase4', { recursive: true })
const listen = page => {
  page.on('console', msg => { if (msg.type() === 'error') report.consoleErrors.push(`${page.url()} :: ${msg.text()}`) })
  page.on('pageerror', err => report.consoleErrors.push(`${page.url()} :: ${err.message}`))
  page.on('requestfailed', req => report.failedRequests.push(`${req.url()} :: ${req.failure()?.errorText}`))
  page.on('response', res => { if (res.status() >= 400) report.failedRequests.push(`${res.status()} ${res.url()}`) })
}
for (const [width, height] of dimensions) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  listen(page)
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1700)
  const metrics = await page.evaluate(() => ({
    viewport: `${innerWidth}×${innerHeight}`,
    documentWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    sections: [...document.querySelectorAll('main > section')].map(section => section.id),
    canvasCount: document.querySelectorAll('canvas').length,
  }))
  report.viewports.push(metrics)
  await page.screenshot({ path: `qa-screenshots/phase4/nexus-${width}x${height}.png` })
  await page.locator('#work').evaluate(el => el.scrollIntoView({ behavior: 'instant' }))
  await page.waitForTimeout(1200)
  for (const project of await page.locator('.project').all()) {
    await project.scrollIntoViewIfNeeded()
    await project.locator('.project-visual img').evaluate(img => img.decode())
  }
  await page.locator('#work').evaluate(el => el.scrollIntoView({ behavior: 'instant' }))
  if (width === 1440 || width === 390) await page.screenshot({ path: `qa-screenshots/phase4/work-${width}x${height}.png` })
  const images = await page.locator('.project-visual img').evaluateAll(imgs => imgs.map(img => ({ src: img.currentSrc, width: img.naturalWidth, height: img.naturalHeight })))
  if (width === 1440) report.projectImagesDesktop = images
  if (width === 390) report.projectImagesMobile = images
  if (width === 1440) {
    await page.locator('#menu-toggle').focus()
    await page.keyboard.press('Enter')
    report.navigation.menuOpenedWithKeyboard = await page.locator('#site-menu').getAttribute('aria-hidden') === 'false'
    await page.keyboard.press('Tab')
    report.navigation.firstMenuLinkFocused = /about/i.test((await page.evaluate(() => document.activeElement?.textContent)) ?? '')
    await page.keyboard.press('Escape')
    report.navigation.escapeClosesAndRestoresFocus = await page.locator('#menu-toggle').getAttribute('aria-expanded') === 'false' && await page.evaluate(() => document.activeElement?.id === 'menu-toggle')
    await page.locator('#menu-toggle').click()
    await page.locator('#site-menu').getByRole('link', { name: /selected work/i }).click()
    report.navigation.sectionLinkWorks = new URL(page.url()).hash === '#work' && await page.locator('#site-menu').getAttribute('aria-hidden') === 'true'
    for (const id of ['velora', 'aether', 'orve']) {
      await page.locator(`#project-${id}`).scrollIntoViewIfNeeded()
      await page.locator(`#project-${id} .project-detail-link`).click()
      const url = new URL(page.url())
      const detail = page.locator('.project-detail')
      const h1 = await detail.locator('h1').innerText()
      const imageState = await detail.locator('.detail-desktop-image img').evaluate(img => ({ ok: img.complete && img.naturalWidth > 0, alt: img.alt }))
      report.details[id] = { query: url.searchParams.get('project'), heading: h1, imageLoaded: imageState.ok, imageAlt: imageState.alt, focusOnHeading: await page.evaluate(() => document.activeElement?.tagName === 'H1') }
      await page.screenshot({ path: `qa-screenshots/phase4/detail-${id}-1440x900.png` })
      await page.reload({ waitUntil: 'networkidle' })
      report.details[id].refreshPreservesDetail = await page.locator('.project-detail h1').innerText() === h1
      const live = page.locator('.detail-live-link')
      report.links[id] = { href: await live.getAttribute('href'), target: await live.getAttribute('target') }
      await page.locator('.detail-return--large').click()
      report.details[id].returnRestoresSelectedWork = new URL(page.url()).hash === '#work' && await page.evaluate(() => document.activeElement?.classList.contains('project-detail-link'))
    }
    const cursor = page.locator('.nexus-cursor')
    await page.locator('.project-visual--aether').hover()
    report.navigation.cursorProjectHover = (await cursor.getAttribute('class'))?.includes('--explore') ?? false
  }
  if (width === 390) {
    const touch = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true })
    listen(touch)
    await touch.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
    report.navigation.customCursorAbsentOnTouch = await touch.locator('.nexus-cursor').count() === 0
    await touch.locator('#menu-toggle').tap()
    await touch.locator('#site-menu').getByRole('link', { name: /selected work/i }).tap()
    report.navigation.mobileSectionLinkWorks = new URL(touch.url()).hash === '#work'
    await touch.locator('#project-orve').scrollIntoViewIfNeeded()
    await touch.locator('#project-orve .project-detail-link').tap()
    report.navigation.mobileProjectDetailOpens = await touch.locator('.project-detail h1').innerText() === 'ORVÉ'
    await touch.screenshot({ path: 'qa-screenshots/phase4/detail-orve-390x844.png' })
    await touch.close()
  }
  await page.close()
}
const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
listen(reduced)
await reduced.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
report.reducedMotion = {
  canvasCount: await reduced.locator('canvas').count(),
  staticFallbackVisible: await reduced.locator('.fallback-sculpture').isVisible(),
  allSectionsVisible: await reduced.locator('#contact-title').evaluate(el => getComputedStyle(el).opacity === '1'),
}
await reduced.screenshot({ path: 'qa-screenshots/phase4/reduced-motion-390x844.png' })
await reduced.close()
report.noHorizontalOverflow = report.viewports.every(viewport => !viewport.horizontalOverflow)
report.consoleErrors = [...new Set(report.consoleErrors)]
report.failedRequests = [...new Set(report.failedRequests)]
await writeFile('qa-screenshots/phase4/report.json', JSON.stringify(report, null, 2))
await browser.close()
console.log(JSON.stringify(report, null, 2))
