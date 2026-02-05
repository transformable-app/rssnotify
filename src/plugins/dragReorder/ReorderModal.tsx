'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, useEffect } from 'react'
import { GripVertical, X } from 'lucide-react'

interface ReorderModalProps {
  collection: string
  fieldName: string
  onClose: () => void
}

interface SortableItemProps {
  id: string
  title: string
}

function SortableItem({ id, title }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem',
    marginBottom: '0.5rem',
    backgroundColor: 'var(--theme-elevation-50)',
    border: '1px solid var(--theme-border-color)',
    borderRadius: '4px',
    color: 'var(--theme-text)',
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        style={{
          display: 'flex',
          cursor: 'grab',
          marginRight: '0.75rem',
          alignItems: 'center',
          color: 'var(--theme-text)',
        }}
      >
        <GripVertical size={20} style={{ color: 'var(--theme-text)' }} />
      </div>
      <div style={{ flex: 1 }}>{title}</div>
    </div>
  )
}

export function ReorderModal({ collection, fieldName, onClose }: ReorderModalProps) {
  const [items, setItems] = useState<Array<{ id: string; title: string }>>([])
  const [itemIds, setItemIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchItems() {
      try {
        const response = await fetch(`/api/${collection}?limit=1000&sort=${fieldName}`)
        if (!response.ok) {
          throw new Error('Failed to fetch items')
        }

        const result = await response.json()
        const itemsList = result.docs.map((doc: { id: string; title?: string; name?: string; slug?: string }) => ({
          id: doc.id,
          title: doc.title || doc.name || doc.slug || doc.id,
        }))

        setItems(itemsList)
        setItemIds(itemsList.map((item: { id: string; title: string }) => item.id))
      } catch (error) {
        console.error('Failed to fetch items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [collection, fieldName])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = itemIds.indexOf(active.id as string)
      const newIndex = itemIds.indexOf(over.id as string)

      setItemIds(arrayMove(itemIds, oldIndex, newIndex))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/${collection}/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: itemIds,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save order')
      }

      // Refresh the page to show new order
      window.location.reload()
    } catch (error) {
      console.error('Failed to save order:', error)
      alert('Failed to save order. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'var(--theme-overlay-background, rgba(0, 0, 0, 0.5))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--theme-elevation-0)',
            color: 'var(--theme-text)',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
          }}
        >
          <div>Loading items...</div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--theme-overlay-background, rgba(0, 0, 0, 0.5))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--theme-elevation-0)',
          color: 'var(--theme-text)',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid var(--theme-border-color)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: 'var(--theme-text)' }}>Reorder {collection}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: 'var(--theme-text)',
            }}
          >
            <X size={20} style={{ color: 'var(--theme-text)' }} />
          </button>
        </div>

        <div style={{ marginBottom: '1rem', color: 'var(--theme-text)', fontSize: '0.875rem', opacity: 0.7 }}>
          Drag items by the grip icon to reorder them
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {itemIds.map((id) => {
              const item = items.find((i) => i.id === id)
              if (!item) return null
              return <SortableItem key={id} id={id} title={item.title} />
            })}
          </SortableContext>
        </DndContext>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn--style-secondary"
            style={{
              padding: '0.5rem 1rem',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn--style-primary"
            style={{
              padding: '0.5rem 1rem',
              opacity: saving ? 0.6 : 1,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

