// https://stackoverflow.com/a/22429679
const hashMini = (x) => {
	const json = `${JSON.stringify(x)}`
	const hash = json.split('').reduce((hash, char, i) => {
		return Math.imul(31, hash) + json.charCodeAt(i) | 0
	}, 0x811c9dc5)
	return ('0000000' + (hash >>> 0).toString(16)).substr(-8)
}

// instance id
const instanceId = (
	String.fromCharCode(Math.random() * 26 + 97) +
	Math.random().toString(36).slice(-7)
)

// https://stackoverflow.com/a/53490958
// https://stackoverflow.com/a/43383990
// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
const hashify = (x, algorithm = 'SHA-256') => {
	const json = `${JSON.stringify(x)}`
	const jsonBuffer = new TextEncoder().encode(json)
	return crypto.subtle.digest(algorithm, jsonBuffer).then((hashBuffer) => {
		const hashArray = Array.from(new Uint8Array(hashBuffer))
		const hashHex = hashArray.map((b) => ('00' + b.toString(16)).slice(-2)).join('')
		return hashHex
	})
}

export { hashMini, instanceId, hashify };
