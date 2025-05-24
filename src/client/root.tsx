import { Suspense } from 'react'
import { Routes, Route } from 'react-router'
import { Router, AppRoute } from '$app/core.tsx'

export default function Root ({
  url,
  routes,
  head,
  ctxHydration,
  routeMap
}: any) {
  return (
    <Suspense>
      <Router location={url}>
        <Routes>
          {routes.map(({ path, component: Component }: any) => {
            return (
              <Route
                key={path}
                path={path}
                element={
                  <AppRoute
                    head={head}
                    ctxHydration={ctxHydration}
                    ctx={routeMap[path]}
                  >
                    <Component />
                  </AppRoute>
                }
              />
            )
          })}
        </Routes>
      </Router>
    </Suspense>
  )
}
