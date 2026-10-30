import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'

const base = 'http://127.0.0.1:4174/'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const report = {
  viewports: [], details: [], navigation: {}, conditions: {},
  projectDestinations: {}, accessibility: {}, consoleErrors: [], failedRequests: [],
}
await mkdir('qa-screenshots/phase6', { recursive: true })
function observe(page) {
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(`${page.url()} :: ${message.text()}`) })
  page.on('pageerror', error => report.consoleErrors.push(`${page.url()} :: ${error.message}`))
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()} :: ${request.failure()?.errorText}`))
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`) })
}

for (const [width, height] of [[1440, 900], [768, 1024], [390, 844], [320, 740]]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  observe(page)
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  const home = await page.evaluate(() => ({
    viewport: `${innerWidth}Ãƒâ€”${innerHeight}`,
    documentWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    sections: [...document.querySelectorAll('main > section')].map(section => section.id),
    h1Count: document.querySelectorAll('h1').length,
    title: document.title,
  }))
  report.viewports.push(home)
  await page.screenshot({ path: `qa-screenshots/phase6/home-${width}x${height}.png` })
  for (const id of ['home', 'about', 'work', 'expertise', 'approach', 'contact']) {
    await page.locator(`#${id}`).evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }))
    await page.waitForTimeout(100)
    const size = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth }))
    if (size.width > size.viewport) report.failedRequests.push(`horizontal overflow in ${id} at ${width}px`)
    if ((width === 1440 || width === 390) && ['about', 'work', 'expertise', 'approach', 'contact'].includes(id)) {
      await page.screenshot({ path: `qa-screenshots/phase6/section-${width}-${id}.png` })
    }
    if (id === 'work') {
      for (const card of await page.locator('.project').all()) {
        await card.scrollIntoViewIfNeeded()
        await card.locator('.project-visual img').evaluate(img => img.decode())
      }
      const images = await page.locator('.project-visual img').evaluateAll(items => items.map(img => ({ src: img.currentSrc, loaded: img.complete && img.naturalWidth > 0, width: img.naturalWidth, height: img.naturalHeight })))
      if (width === 1440 || width === 390) report[`projectImages${width}`] = images
      await page.locator('#work').evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }))
      if (width === 1440 || width === 390) await page.screenshot({ path: `qa-screenshots/phase6/work-${width}.png` })
    }
  }
  const baseChecks = await page.evaluate(() => {
    const duplicateIds = [...document.querySelectorAll('[id]')].map(element => element.id).filter((id, index, all) => all.indexOf(id) !== index)
    const unnamed = [...document.querySelectorAll('a,button')].filter(element => !(element.getAttribute('aria-label') || element.textContent?.trim() || element.getAttribute('title'))).map(element => element.outerHTML.slice(0, 120))
    const imagesWithoutAlt = [...document.images].filter(image => !image.hasAttribute('alt')).map(image => image.currentSrc)
    const unlabeledInputs = [...document.querySelectorAll('input,select,textarea')].filter(input => !input.labels?.length && !input.getAttribute('aria-label')).map(input => input.outerHTML)
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(heading => `${heading.tagName}:${heading.textContent?.trim().replace(/\s+/g, ' ')}`)
    return { duplicateIds, unnamedInteractive: unnamed, imagesWithoutAlt, unlabeledInputs, headings }
  })
  if (width === 1440) {
    report.accessibility = baseChecks
    report.seo = await page.evaluate(() => ({ title: document.title, description: document.querySelector('meta[name=description]')?.content, openGraphTitle: document.querySelector('meta[property="og:title"]')?.content, openGraphDescription: document.querySelector('meta[property="og:description"]')?.content, openGraphImage: document.querySelector('meta[property="og:image"]')?.content, twitterCard: document.querySelector('meta[name="twitter:card"]')?.content, twitterImage: document.querySelector('meta[name="twitter:image"]')?.content, favicon: document.querySelector('link[rel="icon"]')?.getAttribute('href'), canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null }))
  }
  if (width === 1440) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.locator('#menu-toggle').focus()
    await page.keyboard.press('Enter')
    report.navigation.menuOpensByKeyboard = await page.locator('#menu-toggle').getAttribute('aria-expanded') === 'true'
    await page.keyboard.press('Tab')
    report.navigation.firstMenuLinkFocused = /about/i.test((await page.evaluate(() => document.activeElement?.textContent)) ?? '')
    const focusRing = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== 'none' && parseFloat(getComputedStyle(document.activeElement).outlineWidth) > 0)
    report.navigation.focusRingVisible = focusRing
    await page.keyboard.press('Escape')
    report.navigation.escapeRestoresMenuFocus = await page.evaluate(() => document.activeElement?.id === 'menu-toggle')
    await page.locator('#menu-toggle').click()
    await page.locator('#site-menu').getByRole('link', { name: /selected work/i }).click()
    report.navigation.sectionLinkWorks = new URL(page.url()).hash === '#work' && await page.locator('#menu-toggle').getAttribute('aria-expanded') === 'false'
    for (const id of ['velora', 'aether', 'orve']) {
      await page.locator(`#project-${id}`).scrollIntoViewIfNeeded()
      const cardLink = page.locator(`#project-${id} .text-link[href]`)
      report.projectDestinations[id] = { href: await cardLink.getAttribute('href'), target: await cardLink.getAttribute('target') }
      await page.locator(`#project-${id} .project-detail-link`).click()
      report.details.push({ id, opened: await page.locator('.project-detail h1').innerText() === ({ velora: 'VELORA', aether: 'AETHER', orve: 'ORV\u00c9' })[id], title: await page.title(), focus: await page.evaluate(() => document.activeElement?.tagName), query: new URL(page.url()).searchParams.get('project') })
      await page.reload({ waitUntil: 'domcontentloaded' })
      report.details.at(-1).refreshWorks = await page.locator('.project-detail h1').innerText() === ({ velora: 'VELORA', aether: 'AETHER', orve: 'ORV\u00c9' })[id]
      if (id === 'velora') await page.screenshot({ path: 'qa-screenshots/phase6/detail-velora-1440.png' })
      await page.locator('.detail-topbar .detail-return').focus()
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => document.activeElement?.classList.contains('project-detail-link'), null, { timeout: 3000 })
      report.details.at(-1).returnKeyboardFocus = await page.evaluate(() => document.activeElement?.classList.contains('project-detail-link'))
    }
    const unsafe = await page.locator('a[target="_blank"]:not([rel~="noopener"]):not([rel~="noreferrer"])').count()
    report.navigation.externalLinkIsolation = unsafe === 0
    await page.locator('.project-visual--aether').hover()
    report.navigation.projectCursor = (await page.locator('.nexus-cursor').getAttribute('class'))?.includes('--explore') ?? false
  }
  {
    for (const id of ['velora', 'aether', 'orve']) {
      await page.goto(`${base}?project=${id}`, { waitUntil: 'domcontentloaded' })
      await page.locator('.detail-desktop-image img').evaluate(image => image.decode())
      await page.locator('.detail-mobile-image').scrollIntoViewIfNeeded()
      await page.locator('.detail-mobile-image img').evaluate(image => image.decode())
      const detail = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth, heading: document.querySelector('h1')?.textContent, desktopWidth: document.querySelector('.detail-desktop-image img')?.naturalWidth, mobileWidth: document.querySelector('.detail-mobile-image img')?.naturalWidth }))
      report.detailViewportMetrics ??= []
      report.detailViewportMetrics.push({ id, ...detail })
      if (detail.width > detail.viewport) report.failedRequests.push(`horizontal overflow in ${id} detail at ${width}px`)
      if (width === 1440 || width === 390) await page.screenshot({ path: `qa-screenshots/phase6/detail-${id}-${width}.png` })
      if (id === 'orve') report.navigation.detailReturnTab = await page.title()
    }
  }
  await page.close()
}

const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
const reducedRequests = []
reduced.on('request', request => reducedRequests.push(request.url()))
observe(reduced)
await reduced.goto(base, { waitUntil: 'domcontentloaded' })
await reduced.waitForTimeout(1000)
report.conditions.reducedMotion = {
  canvasCount: await reduced.locator('canvas').count(),
  staticFallbackVisible: await reduced.locator('.fallback-sculpture').isVisible(),
  sceneChunkRequested: reducedRequests.some(url => /Scene-|Scene\.tsx|three\/src/.test(url)),
  gsapRequested: reducedRequests.some(url => /gsap|ScrollTrigger/.test(url)),
  sectionsVisible: await reduced.locator('#contact-title').evaluate(element => getComputedStyle(element).opacity === '1'),
}
await reduced.screenshot({ path: 'qa-screenshots/phase6/reduced-motion-390.png' })
await reduced.close()

const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const touchRequests = []
touch.on('request', request => touchRequests.push(request.url()))
observe(touch)
await touch.goto(base, { waitUntil: 'domcontentloaded' })
await touch.waitForTimeout(900)
report.conditions.touch = {
  canvasCount: await touch.locator('canvas').count(),
  staticFallbackVisible: await touch.locator('.fallback-sculpture').isVisible(),
  customCursorCount: await touch.locator('.nexus-cursor').count(),
  sceneChunkRequested: touchRequests.some(url => /Scene-|Scene\.tsx|three\/src/.test(url)),
}
await touch.locator('#menu-toggle').tap()
await touch.locator('#site-menu').getByRole('link', { name: /selected work/i }).tap()
report.navigation.touchSectionLink = new URL(touch.url()).hash === '#work'
await touch.close()

const fallback = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const fallbackRequests = []
fallback.on('request', request => fallbackRequests.push(request.url()))
await fallback.addInitScript(() => {
  const getContext = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    if (type === 'webgl' || type === 'webgl2') return null
    return getContext.call(this, type, ...args)
  }
})
observe(fallback)
await fallback.goto(base, { waitUntil: 'domcontentloaded' })
await fallback.waitForTimeout(800)
report.conditions.webglUnavailable = {
  staticFallbackVisible: await fallback.locator('.fallback-sculpture').isVisible(),
  canvasCount: await fallback.locator('canvas').count(),
  sceneChunkRequested: fallbackRequests.some(url => /Scene-|Scene\.tsx|three\/src/.test(url)),
}
await fallback.close()

const deepLink = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const deepRequests = []
deepLink.on('request', request => deepRequests.push(request.url()))
observe(deepLink)
await deepLink.goto(`${base}#work`, { waitUntil: 'domcontentloaded' })
await deepLink.waitForTimeout(1200)
report.conditions.workHashScrollsToTarget = Math.abs(await deepLink.evaluate(() => document.querySelector('#work').getBoundingClientRect().top)) < 120
report.conditions.workHashDoesNotLoadScene = !deepRequests.some(url => /Scene-|Scene\.tsx|three\/src/.test(url)) && await deepLink.locator('canvas').count() === 0
await deepLink.locator('#home').evaluate(element => element.scrollIntoView({ behavior: 'instant' }))
await deepLink.locator('.scene-canvas').waitFor({ state: 'attached', timeout: 8000 })
report.conditions.sceneLoadsWhenHeroEntersView = await deepLink.locator('canvas').count() === 1
await deepLink.locator('#work').evaluate(element => element.scrollIntoView({ behavior: 'instant' }))
await deepLink.waitForTimeout(500)
report.conditions.scenePausesOffscreen = await deepLink.locator('canvas').count() === 0
await deepLink.close()

const unknown = await browser.newPage({ viewport: { width: 390, height: 844 } })
observe(unknown)
const unknownResponse = await unknown.goto(`${base}not-a-route?project=not-real&utm_source=qa`, { waitUntil: 'domcontentloaded' })
await unknown.waitForTimeout(300)
report.conditions.unknownRouteFallback = { status: unknownResponse?.status(), heroPresent: await unknown.locator('#hero-title').count() === 1, pageErrorFree: await unknown.locator('main').count() === 1 }
await unknown.goto(`${base}?project=not-real&utm_source=qa`, { waitUntil: 'domcontentloaded' })
await unknown.waitForTimeout(200)
report.conditions.unknownProjectQueryCleared = new URL(unknown.url()).search === '?utm_source=qa' && await unknown.locator('#hero-title').count() === 1
await unknown.close()

const external = await browser.newPage()
for (const [id, url] of Object.entries(report.projectDestinations)) {
  try {
    const response = await external.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 15000 })
    report.projectDestinations[id].responseStatus = response?.status() ?? null
  } catch (error) {
    report.projectDestinations[id].navigationError = error.message
  }
}
await external.close()

report.noHorizontalOverflow = report.viewports.every(viewport => !viewport.horizontalOverflow)
const assetContext = await browser.newContext()
report.seoAssets = { faviconStatus: (await assetContext.request.get(`${base}favicon.svg`)).status(), socialPreviewStatus: (await assetContext.request.get(`${base}social-preview.jpg`)).status() }
await assetContext.close()
report.consoleErrors = [...new Set(report.consoleErrors)]
report.failedRequests = [...new Set(report.failedRequests)]
await writeFile('qa-screenshots/phase6/report.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
await browser.close()


