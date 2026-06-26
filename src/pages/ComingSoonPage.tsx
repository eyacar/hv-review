import { useEffect } from 'react'

interface ComingSoonPageProps {
  title: string
}

export default function ComingSoonPage({ title }: ComingSoonPageProps) {
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
