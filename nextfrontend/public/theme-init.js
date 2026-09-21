(function () {
  try {
    var p = window.location.pathname
    if (p !== '/' && !p.startsWith('/dashboard')) {
      document.documentElement.removeAttribute('data-theme')
      return
    }
    var t = localStorage.getItem('tgd-dashboard-theme')
    var d = document.documentElement
    d.setAttribute('data-theme', t === 'light' ? 'light' : 'dark')
  } catch (e) {
    document.documentElement.removeAttribute('data-theme')
  }
})()