import { Suspense } from 'react'

export default function Default ({ children }: any) {
  return (
    <Suspense>
      {children}
    </Suspense>
  )
}
