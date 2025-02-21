import { captureError } from '../errors';
import { createTimer, logTestResult } from '../utils/helpers';

function getErrors(errFns) {
	const errors = []
	let i; const len = errFns.length
	for (i = 0; i < len; i++) {
		try {
			errFns[i]()
		} catch (err) {
			errors.push(err.message)
		}
	}
	return errors
}

export default function getConsoleErrors() {
	try {
		const timer = createTimer()
		timer.start()
		const errorTests = [
			() => new Function('alert(")')(),
			() => new Function('const foo;foo.bar')(),
			() => new Function('null.bar')(),
			() => new Function('abc.xyz = 123')(),
			() => new Function('const foo;foo.bar')(),
			() => new Function('(1).toString(1000)')(),
			() => new Function('[...undefined].length')(),
			() => new Function('var x = new Array(-1)')(),
			() => new Function('const a=1; const a=2;')(),
		]
		const errors = getErrors(errorTests)
		logTestResult({ time: timer.stop(), test: 'console errors', passed: true })
		return { errors }
	} catch (error) {
		logTestResult({ test: 'console errors', passed: false })
		captureError(error)
		return
	}
}
