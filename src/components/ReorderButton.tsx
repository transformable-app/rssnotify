'use client'

import { useState, useEffect, useRef } from 'react'
import { ReorderModal } from '@/plugins/dragReorder/ReorderModal'

function ReorderButton() {
  const [showModal, setShowModal] = useState(false)
  const [collection, setCollection] = useState<string | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    // Get collection from URL path
    const path = window.location.pathname
    const match = path.match(/\/admin\/collections\/([^/]+)/)
    const supportedCollections: string[] = []
    if (match && supportedCollections.includes(match[1])) {
      setCollection(match[1])
    }
  }, [])

  useEffect(() => {
    if (!collection) return

    // Find the Create New button container and insert our button as a sibling
    const findAndInsertButton = () => {
      // Look for the Create New link/button - it's usually an <a> tag with href containing /create
      const createButton = document.querySelector('a[href*="/create"]') as HTMLElement
      if (!createButton) return false

      // Check if we've already inserted our button
      if (createButton.parentElement?.querySelector('[data-reorder-btn]')) {
        return true
      }

      // Find the parent container that holds the button
      // The Create New button is usually wrapped in a span or div
      let parent = createButton.parentElement
      
      // If the parent is the button itself (unlikely), try finding a container
      if (!parent || parent === createButton) {
        // Look for a common container pattern
        parent = createButton.closest('.list-controls, .header-controls, [class*="header"], [class*="controls"]') as HTMLElement
        if (!parent) {
          // Fallback: find the nearest flex container
          let el = createButton.parentElement
          while (el && !getComputedStyle(el).display.includes('flex')) {
            el = el.parentElement
          }
          parent = el || createButton.parentElement
        }
      }
      
      if (!parent) return false

      // Clone the structure of the Create New button to maintain styling
      const createButtonWrapper = createButton.parentElement
      const isWrapped = createButtonWrapper && createButtonWrapper !== parent
      
      if (isWrapped) {
        // If Create New is wrapped, wrap our button the same way
        const wrapper = createButtonWrapper.cloneNode(false) as HTMLElement
        wrapper.setAttribute('data-reorder-btn', 'true')
        
        const reorderBtn = document.createElement('button')
        reorderBtn.type = 'button'
        reorderBtn.textContent = 'Reorder'
        reorderBtn.className = createButton.className // Copy classes from Create New
        reorderBtn.style.marginLeft = '0.5rem'
        
        reorderBtn.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowModal(true)
        }
        
        wrapper.appendChild(reorderBtn)
        buttonRef.current = reorderBtn
        
        // Insert after the Create New wrapper
        parent.insertBefore(wrapper, createButtonWrapper.nextSibling)
      } else {
        // If Create New is not wrapped, create a button with same classes
        const reorderBtn = document.createElement('button')
        reorderBtn.type = 'button'
        reorderBtn.textContent = 'Reorder'
        reorderBtn.setAttribute('data-reorder-btn', 'true')
        reorderBtn.className = createButton.className // Copy classes from Create New
        reorderBtn.style.marginLeft = '0.5rem'
        
        reorderBtn.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowModal(true)
        }
        
        buttonRef.current = reorderBtn
        
        // Insert after the Create New button
        parent.insertBefore(reorderBtn, createButton.nextSibling)
      }
      
      return true
    }

    // Try immediately
    if (findAndInsertButton()) return

    // Retry with interval if not found immediately
    const interval = setInterval(() => {
      if (findAndInsertButton()) {
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [collection])

  if (!collection) {
    return null
  }

  return (
    <>
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

