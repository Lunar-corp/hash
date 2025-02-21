import { captureError } from '../errors'
import { lieProps, documentLie } from '../lies'
import { createTimer, IS_GECKO, logTestResult, LowerEntropy, IS_WEBKIT } from '../utils/helpers'

function hasTouch() {
	try {
		return 'ontouchstart' in window && !!document.createEvent('TouchEvent')
	} catch (err) {
		return false
	}
}

export default async function getScreen(log = true) {
	try {
		const timer = createTimer()
		timer.start()
		let lied = (
			lieProps['Screen.width'] ||
			lieProps['Screen.height'] ||
			lieProps['Screen.availWidth'] ||
			lieProps['Screen.availHeight'] ||
			lieProps['Screen.colorDepth'] ||
			lieProps['Screen.pixelDepth']
		) || false

		const s = (window.screen || {})
		const {
			width,
			height,
			availWidth,
			availHeight,
			colorDepth,
			pixelDepth,
		} = s

		const dpr = window.devicePixelRatio || 0
		const firefoxWithHighDPR = IS_GECKO && (dpr != 1)
		if (!firefoxWithHighDPR) {
			// firefox with high dpr requires floating point precision dimensions
			const matchMediaLie = !matchMedia(
				`(device-width: ${width}px) and (device-height: ${height}px)`,
			).matches
			if (matchMediaLie) {
				lied = true
				documentLie('Screen', 'failed matchMedia')
			}
		}

		const hasLiedDPR = !matchMedia(`(resolution: ${dpr}dppx)`).matches
		if (!IS_WEBKIT && hasLiedDPR) {
			lied = true
			documentLie('Window.devicePixelRatio', 'lied dpr')
		}

		const noTaskbar = !(width - availWidth || height - availHeight)
		if (width > 800 && noTaskbar) {
			LowerEntropy.SCREEN = true
		}

		const data = {
			width,
			height,
			availWidth,
			availHeight,
			colorDepth,
			pixelDepth,
			touch: hasTouch(),
			lied,
		}

		log && logTestResult({ time: timer.stop(), test: 'screen', passed: true })
		return data
	} catch (error) {
		log && logTestResult({ test: 'screen', passed: false })
		captureError(error)
		return
	}
}
