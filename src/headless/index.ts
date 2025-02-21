/* eslint-disable new-cap */
import { captureError } from '../errors'
import { lieProps, PARENT_PHANTOM } from '../lies'
import { instanceId } from '../utils/crypto'
import { createTimer, queueEvent, IS_BLINK, logTestResult } from '../utils/helpers'
import getPlatformEstimate from './getPlatformEstimate'
import { getSystemFonts } from './getSystemFonts'

export default async function getHeadlessFeatures({
	webgl,
	workerScope,
}) {
	try {
		const timer = createTimer()
		await queueEvent(timer)
		const mimeTypes = Object.keys({ ...navigator.mimeTypes })

		const systemFonts = getSystemFonts()
		const [scores, highestScore, headlessEstimate] = getPlatformEstimate()

		interface Headless {
			chromium: boolean,
			likeHeadless: Record<string, boolean>,
			headless: Record<string, boolean>,
			stealth: Record<string, boolean>,
		}
		const data: Headless = {
			chromium: IS_BLINK,
			likeHeadless: {
				noChrome: IS_BLINK && !('chrome' in window),
				hasPermissionsBug: (
					IS_BLINK &&
					'permissions' in navigator &&
					await (async () => {
						const res = await navigator.permissions.query({ name: 'notifications' })
						return (
							res.state == 'prompt' &&
							'Notification' in window &&
							Notification.permission === 'denied'
						)
					})()
				),
				noPlugins: IS_BLINK && navigator.plugins.length === 0,
				noMimeTypes: IS_BLINK && mimeTypes.length === 0,
				notificationIsDenied: (
					IS_BLINK &&
					'Notification' in window &&
					(Notification.permission == 'denied')
				),
				hasKnownBgColor: IS_BLINK && (() => {
					let rendered = PARENT_PHANTOM
					if (!PARENT_PHANTOM) {
						rendered = document.createElement('div')
						document.body.appendChild(rendered)
					}
					if (!rendered) return false
					rendered.setAttribute('style', `background-color: ActiveText`)
					const { backgroundColor: activeText } = getComputedStyle(rendered) || []
					if (!PARENT_PHANTOM) {
						document.body.removeChild(rendered)
					}
					return activeText === 'rgb(255, 0, 0)'
				})(),
				prefersLightColor: matchMedia('(prefers-color-scheme: light)').matches,
				uaDataIsBlank: (
					'userAgentData' in navigator && (
						// @ts-expect-error if userAgentData is null
						navigator.userAgentData?.platform === '' ||
						// @ts-expect-error if userAgentData is null
						await navigator.userAgentData.getHighEntropyValues(['platform']).platform === ''
					)
				),
				pdfIsDisabled: (
					'pdfViewerEnabled' in navigator && navigator.pdfViewerEnabled === false
				),
				noTaskbar: (
					screen.height === screen.availHeight &&
					screen.width === screen.availWidth
				),
				hasVvpScreenRes: (
					(innerWidth === screen.width && outerHeight === screen.height) || (
						'visualViewport' in window &&
						// @ts-expect-error if unsupported
						(visualViewport.width === screen.width && visualViewport.height === screen.height)
					)
				),
				hasSwiftShader: /SwiftShader/.test(workerScope?.webglRenderer),
				noWebShare: IS_BLINK && CSS.supports('accent-color: initial') && (
					!('share' in navigator) || !('canShare' in navigator)
				),
				noContentIndex: !!headlessEstimate?.noContentIndex,
				noContactsManager: !!headlessEstimate?.noContactsManager,
				noDownlinkMax: !!headlessEstimate?.noDownlinkMax,
			},
			headless: {
				webDriverIsOn: (
					(CSS.supports('border-end-end-radius: initial') && navigator.webdriver === undefined) ||
					!!navigator.webdriver ||
					!!lieProps['Navigator.webdriver']
				),
				hasHeadlessUA: (
					/HeadlessChrome/.test(navigator.userAgent) ||
					/HeadlessChrome/.test(navigator.appVersion)
				),
				hasHeadlessWorkerUA: !!workerScope && (
					/HeadlessChrome/.test(workerScope.userAgent)
				),
			},
			stealth: {
				hasIframeProxy: (() => {
					try {
						const iframe = document.createElement('iframe')
						iframe.srcdoc = instanceId
						return !!iframe.contentWindow
					} catch (err) {
						return true
					}
				})(),
				hasHighChromeIndex: (() => {
					const key = 'chrome'
					const highIndexRange = -50
					return (
						Object.keys(window).slice(highIndexRange).includes(key) &&
						Object.getOwnPropertyNames(window).slice(highIndexRange).includes(key)
					)
				})(),
				hasBadChromeRuntime: (() => {
					// @ts-expect-error if unsupported
					if (!('chrome' in window && 'runtime' in chrome)) {
						return false
					}
					try {
						// @ts-expect-error if unsupported
						if ('prototype' in chrome.runtime.sendMessage ||
							// @ts-expect-error if unsupported
							'prototype' in chrome.runtime.connect) {
							return true
						}
						// @ts-expect-error if unsupported
						new chrome.runtime.sendMessage
						// @ts-expect-error if unsupported
						new chrome.runtime.connect
						return true
					} catch (err: any) {
						return err.constructor.name != 'TypeError' ? true : false
					}
				})(),
				hasToStringProxy: (
					!!lieProps['Function.toString']
				),
				hasBadWebGL: (() => {
					const { UNMASKED_RENDERER_WEBGL: gpu } = webgl?.parameters || {}
					const { webglRenderer: workerGPU } = workerScope || {}
					return (gpu && workerGPU && (gpu !== workerGPU))
				})(),
			},
		}

		const { likeHeadless, headless, stealth } = data
		const likeHeadlessKeys = Object.keys(likeHeadless)
		const headlessKeys = Object.keys(headless)
		const stealthKeys = Object.keys(stealth)

		const likeHeadlessRating = +((likeHeadlessKeys.filter((key) => likeHeadless[key]).length / likeHeadlessKeys.length) * 100).toFixed(0)
		const headlessRating = +((headlessKeys.filter((key) => headless[key]).length / headlessKeys.length) * 100).toFixed(0)
		const stealthRating = +((stealthKeys.filter((key) => stealth[key]).length / stealthKeys.length) * 100).toFixed(0)

		logTestResult({ time: timer.stop(), test: 'headless', passed: true })
		return {
			...data,
			likeHeadlessRating,
			headlessRating,
			stealthRating,
			systemFonts,
			platformEstimate: [scores, highestScore],
		}
	} catch (error) {
		logTestResult({ test: 'headless', passed: false })
		captureError(error)
		return
	}
}
