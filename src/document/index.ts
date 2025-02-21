import { captureError } from '../errors'
import { createTimer, logTestResult } from '../utils/helpers'

export default function getHTMLElementVersion() {
	try {
		const timer = createTimer()
		timer.start()
		const keys = []
		// eslint-disable-next-line guard-for-in
		for (const key in document.documentElement) {
			keys.push(key)
		}
		logTestResult({ time: timer.stop(), test: 'html element', passed: true })
		return { keys }
	} catch (error) {
		logTestResult({ test: 'html element', passed: false })
		captureError(error)
		return
	}
}
