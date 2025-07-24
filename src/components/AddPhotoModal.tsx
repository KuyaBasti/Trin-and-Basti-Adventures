'use client'

import React, { useState } from 'react'
import { Photo } from './AdventuresPage'

interface AddPhotoModalProps {
  isOpen: boolean
  onClose: () => void
  onAddPhoto: (photo: Omit<Photo, 'id'>) => void
}

export default function AddPhotoModal({ isOpen, onClose, onAddPhoto }: AddPhotoModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    date: '',
    description: '',
    category: 'travels' as Photo['category'],
    imagePath: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.location || !formData.date || !formData.description || !formData.imagePath) {
      alert('Please fill in all fields')
      return
    }

    onAddPhoto({
      src: formData.imagePath,
      alt: formData.title,
      title: formData.title,
      location: formData.location,
      date: formData.date,
      description: formData.description,
      category: formData.category
    })

    // Reset form
    setFormData({
      title: '',
      location: '',
      date: '',
      description: '',
      category: 'travels',
      imagePath: ''
    })
    
    onClose()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        display: 'flex',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          padding: '30px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '24px',
            margin: '0'
          }}>Add New Memory</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '16px'
              }}
              placeholder="Give this memory a title"
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '16px'
              }}
              placeholder="Where was this memory made?"
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '16px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '16px'
              }}
            >
              <option value="travels">Travels</option>
              <option value="date-nights">Date Nights</option>
              <option value="adventures">Adventures</option>
              <option value="special-days">Special Days</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>Image Path</label>
            <input
              type="text"
              name="imagePath"
              value={formData.imagePath}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '16px'
              }}
              placeholder="your-image.jpg"
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '16px',
                height: '120px',
                resize: 'vertical' as const
              }}
              placeholder="What makes this memory special?"
              required
            />
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: '#333',
              color: '#fff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#555'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#333'
            }}
          >
            Add Memory
          </button>
        </form>
      </div>
    </div>
  )
} 