import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileSearch } from 'lucide-react'
import { MOCK_REVIEW_ID } from '../api/review'

export default function HomePage() {
  useEffect(() => {
    document.title = 'Document Review — HomeVision'
  }, [])

  return (
    <>
      <div className="home-page">
        <div className="home-page__card">
          <FileSearch size={40} className="home-page__icon" aria-hidden="true" />
          <h1 className="home-page__title">Document Review</h1>
          <p className="home-page__desc">
            Review AI-identified issues in uploaded documents before submission.
          </p>
          <Link to={`/reviews/${MOCK_REVIEW_ID}`} className="btn btn--primary home-page__cta">
            Open demo review
          </Link>
        </div>
      </div>
    </>
  )
}
