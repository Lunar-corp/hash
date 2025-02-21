import { captureError } from '../errors'
import { createTimer, logTestResult } from '../utils/helpers'

// inspired by
// - https://privacycheck.sec.lrz.de/active/fp_cpt/fp_can_play_type.html
// - https://arkenfox.github.io/TZP
const getMimeTypeShortList = () => [
	'audio/ogg; codecs="vorbis"',
	'audio/mpeg',
	'audio/mpegurl',
	'audio/wav; codecs="1"',
	'audio/x-m4a',
	'audio/aac',
	'video/ogg; codecs="theora"',
	'video/quicktime',
	'video/mp4; codecs="avc1.42E01E"',
	'video/webm; codecs="vp8"',
	'video/webm; codecs="vp9"',
	'video/x-matroska',
].sort()

export default async function getMedia() {
	const getMimeTypes = () => {
		try {
			const mimeTypes = getMimeTypeShortList()
			const videoEl = document.createElement('video')
			const audioEl = new Audio()
			const isMediaRecorderSupported = 'MediaRecorder' in window
			const types = mimeTypes.reduce((acc, type) => {
				const data = {
					mimeType: type,
					audioPlayType: audioEl.canPlayType(type),
					videoPlayType: videoEl.canPlayType(type),
					mediaSource: MediaSource.isTypeSupported(type),
					mediaRecorder: isMediaRecorderSupported ? MediaRecorder.isTypeSupported(type) : false,
				}
				if (!data.audioPlayType && !data.videoPlayType && !data.mediaSource && !data.mediaRecorder) {
					return acc
				}
				// @ts-ignore
				acc.push(data)
				return acc
			}, [])
			return types
		} catch (error) {
			return
		}
	}

	try {
		const timer = createTimer()
		timer.start()
		const mimeTypes = getMimeTypes()

		logTestResult({ time: timer.stop(), test: 'media', passed: true })
		return { mimeTypes }
	} catch (error) {
		logTestResult({ test: 'media', passed: false })
		captureError(error)
		return
	}
}
