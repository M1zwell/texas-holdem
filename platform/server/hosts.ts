export function isMizHost(hostname: string): boolean {
  switch (hostname) {
    case 'miz.gg':
    case 'www.miz.gg':
    case 'm1z.gg':
    case 'www.m1z.gg':
      return true
    default:
      return false
  }
}

export function publicOrigin(request: Request): string {
  const url = new URL(request.url)
  if (isMizHost(url.hostname)) {
    return `${url.protocol}//${url.hostname === 'www.miz.gg' ? 'miz.gg' : url.hostname}`
  }
  return ''
}
