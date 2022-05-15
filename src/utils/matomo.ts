// fixes type error
declare global {
  interface Window {
    _paq: any
  }
}

// https://developer.matomo.org/guides/spa-tracking
export const pageview = (url: string): void => {
  window._paq = window._paq || []
  window._paq.push(['setCustomUrl', url])
  window._paq.push(['setDocumentTitle', document.title])
  window._paq.push(['trackPageView'])
}

// https://matomo.org/docs/event-tracking
export const event = (category: string, action: string, name: string, value: string): void => {
  window._paq = window._paq || []
  window._paq.push(['trackEvent', category, action, name, value])
}
