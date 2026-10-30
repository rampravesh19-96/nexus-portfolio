import { chromium } from 'playwright'
import { copyFile, mkdir } from 'node:fs/promises'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const dimensions = [[1440, 900], [768, 1024], [390, 844], [320, 740]]
const report = { viewports: [], sections: [], consoleErrors: [], failedRequests: [], interactions: {}, recording: null }
await mkdir('qa-screenshots', { recursive: true })
await mkdir('qa-recordings', { recursive: true })

for (const [width, height] of dimensions) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()) })
  page.on('pageerror', error => report.consoleErrors.push(error.message))
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()} — ${request.failure()?.errorText}`))
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`) })
  await page.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)
  const metrics = await page.evaluate(() => ({
    viewport: `${innerWidth}×${innerHeight}`,
    documentWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    heroTitle: document.querySelector('h1')?.innerText,
    canvasCount: document.querySelectorAll('canvas').length,
    sections: [...document.querySelectorAll('main > section')].map(section => section.id),
  }))
  report.viewports.push(metrics)
  if (width === 1440) report.sections = metrics.sections
  for (const reveal of await page.locator('[data-reveal]').all()) {
    await reveal.scrollIntoViewIfNeeded()
    await page.waitForTimeout(25)
  }
  await page.waitForTimeout(950)
  if (width === 1440) await page.screenshot({ path: 'qa-screenshots/full-page-overview.png', fullPage: true })
  if (width === 1440 || width === 390) {
    for (const sectionId of ['home', 'about', 'work', 'expertise', 'approach', 'contact']) {
      await page.locator(`#${sectionId}`).evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }))
      await page.waitForTimeout(120)
      await page.screenshot({ path: `qa-screenshots/section-${width}x${height}-${sectionId}.png` })
    }
    await page.locator('.skill-stage').evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await page.waitForTimeout(180)
    await page.screenshot({ path: `qa-screenshots/skill-universe-${width}x${height}.png` })
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(150)
  await page.screenshot({ path: `qa-screenshots/${width}x${height}.png` })
  if (width === 1440) {
    const menu = page.locator('#site-menu')
    await page.locator('#menu-toggle').focus()
    await page.keyboard.press('Enter')
    report.interactions.menuOpened = await menu.getAttribute('aria-hidden') === 'false'
    await page.keyboard.press('Tab')
    report.interactions.menuKeyboardFocus = /about/i.test((await page.evaluate(() => document.activeElement?.textContent)) ?? '')
    await page.keyboard.press('Escape')
    report.interactions.menuEscapeClosesAndRestoresFocus = await page.getByRole('button', { name: /navigation/i }).getAttribute('aria-expanded') === 'false' && await page.evaluate(() => document.activeElement?.id === 'menu-toggle')
    await page.locator('#menu-toggle').focus()
    await page.keyboard.press('Enter')
    report.interactions.sectionLinks = {}
    for (const [label, id] of [['About', 'about'], ['Selected work', 'work'], ['Expertise', 'expertise'], ['Approach', 'approach'], ['Contact', 'contact']]) {
      if (await menu.getAttribute('aria-hidden') === 'true') await page.getByRole('button', { name: /navigation/i }).click()
      await menu.getByRole('link', { name: new RegExp(label, 'i') }).click()
      report.interactions.sectionLinks[id] = new URL(page.url()).hash === `#${id}`
    }
    report.interactions.menuClosedAfterNavigation = await page.getByRole('button', { name: /navigation/i }).getAttribute('aria-expanded') === 'false'
    report.interactions.projectDestinationsPendingAndDisabled = await page.locator('.text-link--pending:disabled').count() === 3
    report.interactions.socialLinksHaveNoPlaceholderDestinations = await page.locator('.social-placeholder--pending:not(a)').count() === 3
    const reactSkill = page.getByRole('button', { name: 'React', exact: true })
    await reactSkill.focus()
    await page.keyboard.press('Enter')
    report.interactions.skillKeyboardActivation = await reactSkill.getAttribute('aria-pressed') === 'true'
    await page.getByRole('button', { name: 'Space & motion' }).click()
    report.interactions.skillGroupFilter = await page.getByRole('button', { name: 'Three.js' }).count() === 1 && await page.getByRole('button', { name: 'React', exact: true }).count() === 0
    await page.getByRole('button', { name: 'All disciplines' }).click()
    await page.locator('.skill-stage').hover({ position: { x: 30, y: 40 } })
    const tiltBefore = await page.locator('.skill-space').getAttribute('style')
    const skillStage = await page.locator('.skill-stage').boundingBox()
    await page.mouse.move(skillStage.x + skillStage.width * .72, skillStage.y + skillStage.height * .23)
    report.interactions.interactiveSkillPointerTilt = await page.waitForFunction(before => document.querySelector('.skill-space')?.getAttribute('style') !== before, tiltBefore).then(() => true)
    await page.getByRole('button', { name: 'React', exact: true }).hover()
    report.interactions.cursorInteractiveState = (await page.locator('.nexus-cursor').getAttribute('class'))?.includes('nexus-cursor--interactive')
    await page.locator('.project-visual--aether').hover()
    report.interactions.cursorProjectExplorationState = (await page.locator('.nexus-cursor').getAttribute('class'))?.includes('nexus-cursor--explore')
    await page.waitForTimeout(1000)
    report.interactions.projectRevealFinished = (await page.locator('.project-visual--aether').evaluate(element => getComputedStyle(element).clipPath)).includes('0px')
    const pointerX = await page.locator('.hero-art').getAttribute('data-pointer-x')
    await page.mouse.move(1050, 380)
    await page.waitForFunction(previous => document.querySelector('.hero-art')?.getAttribute('data-pointer-x') !== previous, pointerX)
    report.interactions.pointerResponded = await page.locator('.hero-art').getAttribute('data-pointer-x') !== pointerX
    await page.locator('#approach').scrollIntoViewIfNeeded()
    await page.waitForTimeout(200)
    report.interactions.heroScenePausesOffscreen = await page.locator('.scene-canvas').count() === 0
    await page.getByRole('link', { name: /back to the beginning/i }).click()
    report.interactions.footerReturnHome = new URL(page.url()).hash === '#home'
  }
  await page.close()
}

const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
reduced.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()) })
reduced.on('pageerror', error => report.consoleErrors.push(error.message))
reduced.on('requestfailed', request => report.failedRequests.push(`${request.url()} — ${request.failure()?.errorText}`))
reduced.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`) })
await reduced.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' })
report.interactions.reducedMotionHidesWebGL = await reduced.locator('canvas').count() === 0
report.interactions.reducedMotionShowsStaticSculpture = await reduced.locator('.fallback-sculpture').isVisible()
report.interactions.reducedMotionKeepsSectionsVisible = await reduced.locator('#contact-title').evaluate(element => getComputedStyle(element).opacity === '1')
await reduced.screenshot({ path: 'qa-screenshots/reduced-motion-390x844.png', fullPage: true })
await reduced.close()

const fallback = await browser.newPage({ viewport: { width: 390, height: 844 } })
fallback.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()) })
fallback.on('pageerror', error => report.consoleErrors.push(error.message))
fallback.on('requestfailed', request => report.failedRequests.push(`${request.url()} — ${request.failure()?.errorText}`))
fallback.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`) })
await fallback.addInitScript(() => {
  const original = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    if (type === 'webgl' || type === 'webgl2') return null
    return original.call(this, type, ...args)
  }
})
await fallback.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' })
report.interactions.webglFallbackVisible = await fallback.locator('.fallback-sculpture').isVisible()
report.interactions.webglFallbackNoCanvas = await fallback.locator('canvas').count() === 0
await fallback.close()

const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
const touch = await touchContext.newPage()
touch.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()) })
touch.on('pageerror', error => report.consoleErrors.push(error.message))
touch.on('requestfailed', request => report.failedRequests.push(`${request.url()} — ${request.failure()?.errorText}`))
touch.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`) })
await touch.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' })
report.interactions.customCursorDisabledOnTouch = await touch.locator('.nexus-cursor').count() === 0
await touch.locator('#expertise').evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }))
await touch.waitForTimeout(950)
await touch.getByRole('button', { name: 'React', exact: true }).tap()
report.interactions.skillTouchSelection = await touch.getByRole('button', { name: 'React', exact: true }).getAttribute('aria-pressed') === 'true'
await touch.getByRole('button', { name: 'Experience quality' }).tap()
report.interactions.skillTouchGroupFilter = await touch.getByRole('button', { name: 'Accessibility' }).count() === 1
await touchContext.close()

const recordingContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: 'qa-recordings', size: { width: 1440, height: 900 } } })
const recordingPage = await recordingContext.newPage()
recordingPage.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()) })
recordingPage.on('pageerror', error => report.consoleErrors.push(error.message))
await recordingPage.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' })
const recordingProject = recordingPage.locator('.project-visual--orve')
await recordingProject.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
await recordingPage.waitForTimeout(1000)
await recordingProject.hover()
await recordingPage.waitForTimeout(700)
await recordingPage.locator('#expertise').scrollIntoViewIfNeeded()
await recordingPage.waitForTimeout(1000)
await recordingPage.getByRole('button', { name: 'Three.js' }).click()
await recordingPage.getByRole('button', { name: 'All disciplines' }).click()
await recordingPage.getByRole('button', { name: 'Accessibility' }).click()
await recordingPage.waitForTimeout(500)
await recordingContext.close()
const recordedVideo = await recordingPage.video().path()
await copyFile(recordedVideo, 'qa-recordings/phase3-interactions.webm')
report.recording = 'qa-recordings/phase3-interactions.webm'
await browser.close()
console.log(JSON.stringify(report, null, 2))
