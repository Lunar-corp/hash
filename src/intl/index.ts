import { caniuse, captureError } from '../errors'
import { lieProps } from '../lies'
import { createTimer, queueEvent, logTestResult } from '../utils/helpers'

export default async function getIntl() {
	const getLocale = (intl) => {
		const constructors = [
			'Collator',
			'DateTimeFormat',
			'DisplayNames',
			'ListFormat',
			'NumberFormat',
			'PluralRules',
			'RelativeTimeFormat',
		]
		// @ts-ignore
		const locale = constructors.reduce((acc, name) => {
			try {
				const obj = new intl[name]
				if (!obj) {
					return acc
				}
				const { locale } = obj.resolvedOptions() || {}
				return [...acc, locale]
			} catch (error) {
				return acc
			}
		}, [])

		return [...new Set(locale)]
	}

	try {
		const timer = createTimer()
		await queueEvent(timer)
		const lied = (
			lieProps['Intl.Collator.resolvedOptions'] ||
			lieProps['Intl.DateTimeFormat.resolvedOptions'] ||
			lieProps['Intl.DisplayNames.resolvedOptions'] ||
			lieProps['Intl.ListFormat.resolvedOptions'] ||
			lieProps['Intl.NumberFormat.resolvedOptions'] ||
			lieProps['Intl.PluralRules.resolvedOptions'] ||
			lieProps['Intl.RelativeTimeFormat.resolvedOptions']
		) || false

		const dateTimeFormat = caniuse(() => {
			return new Intl.DateTimeFormat(undefined, {
				month: 'long',
				timeZoneName: 'long',
			}).format(963644400000)
		})

		const displayNames = caniuse(() => {
			return new Intl.DisplayNames(undefined, {
				type: 'language',
			}).of('en-US')
		})

		const listFormat = caniuse(() => {
			// @ts-ignore
			return new Intl.ListFormat(undefined, {
				style: 'long',
				type: 'disjunction',
			}).format(['0', '1'])
		})

		const numberFormat = caniuse(() => {
			return new Intl.NumberFormat(undefined, {
				notation: 'compact',
				compactDisplay: 'long',
			}).format(21000000)
		})

		const pluralRules = caniuse(() => {
			return new Intl.PluralRules().select(1)
		})

		const relativeTimeFormat = caniuse(() => {
			return new Intl.RelativeTimeFormat(undefined, {
				localeMatcher: 'best fit',
				numeric: 'auto',
				style: 'long',
			}).format(1, 'year')
		})

		const locale = getLocale(Intl)

		logTestResult({ time: timer.stop(), test: 'intl', passed: true })
		return {
			dateTimeFormat,
			displayNames,
			listFormat,
			numberFormat,
			pluralRules,
			relativeTimeFormat,
			locale: ''+locale,
			lied,
		}
	} catch (error) {
		logTestResult({ test: 'intl', passed: false })
		captureError(error)
		return
	}
}
