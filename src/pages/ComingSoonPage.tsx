import { useEffect } from 'react'

import { z } from 'zod'

const ComingSoonPagePropsSchema = z.object({
  title: z.string().min(1),
})

type ComingSoonPageProps = z.infer<typeof ComingSoonPagePropsSchema>

export default function ComingSoonPage(rawProps: ComingSoonPageProps) {
  const { title } = ComingSoonPagePropsSchema.parse(rawProps)
  useEffect(() => {
    document.title = `${title} — HomeVision`
    return () => {
      document.title = 'Document Review — HomeVision'
    }
  }, [title])

  return (
    <>
      <div className="coming-soon">
        <p className="coming-soon__label">Coming soon</p>
        <h1 className="coming-soon__title">{title}</h1>
        <p className="coming-soon__desc">
          This page is being built by another engineer. Check back soon.
        </p>
      </div>
    </>
  )
}
