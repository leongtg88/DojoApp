import fs from 'node:fs'
import path from 'node:path'

const repo = path.resolve(import.meta.dirname, '..', '..', '..')
const worktrees = [
  { name: 'prod', root: path.join(repo, '..', 'dojoapp-prod', 'nextfrontend') },
  { name: 'new', root: path.join(repo, '..', 'dojoapp-b5', 'nextfrontend') },
]

function walk(dir, rel = '') {
  const routes = []
  if (!fs.existsSync(dir)) return routes
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    const nextRel = rel ? `${rel}/${entry.name}` : entry.name
    if (entry.isDirectory()) routes.push(...walk(full, nextRel))
    else if (entry.name === 'page.tsx') {
      const route = `/admin${rel ? `/${rel}` : ''}`.replaceAll('\\', '/')
      routes.push(route)
    }
  }
  return routes
}

for (const wt of worktrees) {
  const root = path.join(wt.root, 'app', '(dashboard)', 'admin')
  const routes = walk(root).sort()
  const out = path.join(repo, 'audit', 'b5', 'reports', `routes-${wt.name}.json`)
  fs.writeFileSync(out, JSON.stringify(routes, null, 2))
  console.log(wt.name, routes.length, routes.join(' '))
}
