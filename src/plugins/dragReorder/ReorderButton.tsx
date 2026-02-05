'use client'

import { useState, useEffect } from 'react'
import { ReorderModal } from './ReorderModal'

function ReorderButton() {
  const [showModal, setShowModal] = useState(false)
  const [collection, setCollection] = useState<string | null>(null)

  useEffect(() => {
    // No collections use drag reorder in this project
  }, [])

  if (!collection) {
    return null
  }

  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Reorder
        </button>
      </div>
      {showModal && (
        <ReorderModal
          collection={collection}
          fieldName="order"
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

export default ReorderButton

