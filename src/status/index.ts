export async function getStorage(): Promise<number | null> {
  if (!navigator?.storage?.estimate) return null
  return Promise.all([
    navigator.storage.estimate().then(({ quota }) => quota),
    new Promise((resolve) => {
      // @ts-expect-error if not supported
      navigator.webkitTemporaryStorage.queryUsageAndQuota((_, quota) => {
        resolve(quota)
      })
    }).catch(() => null),
  ]).then(([quota1, quota2]) => (quota2 || quota1) as number)
}
