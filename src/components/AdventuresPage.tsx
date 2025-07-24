'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Header from './Header'
import FeaturedMemory from './FeaturedMemory'
import PhotoGrid from './PhotoGrid'
import AddPhotoModal from './AddPhotoModal'
import Footer from './Footer'

export interface Photo {
  id: string
  src: string
  alt: string
  title: string
  location: string
  date: string
  description: string
  category: 'travels' | 'date-nights' | 'adventures' | 'special-days'
}

export default function AdventuresPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const photosData = [
    {
      src: '/Papago.png',
      alt: 'Papago Park',
      title: 'Thanksgiving with the Goods',
      location: 'Papago Park, Phoenix, AZ',
      date: 'November 26, 2024',
      description: `First time meeting the Good Family during Thanksgiving.
        It was so much fun except for when you made fun of me when I slipped
        on the way down from the hike. `,
      category: 'special-days' as const
    },
    {
      src: '/Lights.png',
      alt: 'Christmas Lights',
      title: 'New Years with the Goods',
      location: 'Scottsdale, AZ',
      date: 'December 31, 2024',
      description: `This was such a fun night. We got to see such beautiful lights.
        Your family saw for the first time how weird and funny we are as a couple.
        Protein! Protein! Protein!`,
      category: 'special-days' as const
    },
    {
      src: '/Dazzle.JPG',
      alt: 'Scotssdazzle',
      title: 'Razzle Dazzle at Scottsdazzle',
      location: 'Scottsdale, AZ',
      date: 'December 12, 2024',
      description: `Our first time going to Scottsdazzle together. 
        We had a great time and it was a lot of fun. 
        Out of all the bright shining lights, 
        I think the one that stood out the most was you and your beautiful smile.`,
      category: 'special-days' as const
    },
    {
      src: '/BrunchSnob.png',
      alt: 'Brunch Snob',
      title: 'Brunch Snob',
      location: 'Brunch Snob, Scottsdale, AZ',
      date: 'January 12, 2025',
      description: `We went to brunch to this wonderful vibey place called Brunch Snob. 
        We always wanted to eat Onion Rings and we finally we were finally able to. 
        It was our last day together before I go back home :(`,
      category: 'special-days' as const
    },
    {
      src: '/SFNight.png',
      alt: 'Chinese New Year',
      title: 'Chinese New Year',
      location: 'San Francisco, CA',
      date: 'February 15, 2025',
      description: `Chinese New Year at San Francisco! 
        Although we were not able to go to Chinatown, 
        we were able to enjoy each other's company and have a good time.`,
      category: 'special-days' as const
    },
    {
      src: '/PalaceFineArts.JPG',
      alt: 'Palace of Fine Arts',
      title: 'Palace of Fine Arts',
      location: 'Palace of Fine Arts, San Francisco, CA',
      date: 'February 15, 2025',
      description: `Our magical day at the Palace of Fine Arts in San Francisco. 
        The way the golden light illuminated the classical architecture, 
        creating perfect silhouettes against the lagoon. 
        We spent hours promenading through the colonnade and taking pictures. 
        Such a romantic spot in the city.`,
      category: 'travels' as const
    },
    {
      src: '/TeaGarden.JPG',
      alt: 'Japanese Tea Garden',
      title: 'Japanese Tea Garden',
      location: 'Japanese Tea Garden, San Francisco, CA',
      date: 'February 17, 2025',
      description: `Our first time going to the Japanese Tea Garden together. 
        We had a great time and it was a lot of fun. 
        We got to see your favorite which is the Koi fish pond lol. 
        There were also a lot of beautiful flowers and trees. 
        It felt so peaceful and relaxing.`,
      category: 'travels' as const
    },
    {
      src: '/Windmill.JPG',
      alt: 'Dutch Windmill',
      title: 'Dutch Windmill',
      location: 'Golden Gate Park, San Francisco, CA',
      date: 'March 21, 2025',
      description: `It felt so nice seeing the beautiful 
        flowers blooming for the first time in Spring. 
        We also got to see the Dutch Windmill and the beautiful view of the ocean. 
        You were so beautiful and I fell inlove even more with you.`,
      category: 'travels' as const
    },
    {
      src: '/LakeBeryessa.JPG',
      alt: 'Lake day',
      title: 'Lake Beryessa',
      location: 'Lake Berryessa, Napa County, CA',
      date: 'March 28, 2025',
      description: `Spontaneous walk along Lake Beryessa. 
        The way the light hit your face against the calm waters 
        is something I'll never forget. 
        Let us not forget when we picked wildflowers and made bouqet off of them.`,
      category: 'travels' as const
    },
    {
      src: '/TrinBday.png',
      alt: 'Trinity\'s Birthday',
      title: 'Trinity\'s Birthday',
      location: 'Scottsdale, AZ',
      date: 'June 25, 2025',
      description: `Trinity's Birthday! 
        My princess's most important day. She deserved all the love and attention.
        We spent time both with your friends and your family all throughout the day.`,
      category: 'special-days' as const
    },
  ]

  const [photos, setPhotos] = useState<Photo[]>(
    photosData.map((photo, index) => ({
      ...photo,
      id: `photo-${index + 1}`
    }))
  )

  const featuredPhoto: Photo = {
    id: 'featured',
    src: '/MainPic.png',
    alt: 'Our first moment together',
    title: 'Our first moment together',
    location: 'Scottsdale, AZ',
    date: 'July 21, 2024',
    description: `This was our first official photo taken of us. 
      It was a very fun and awful experience at the same time wink wink lol. 
      I threw up, you ruined your shirt. 
      But all in all we enjoyed our time together and we had a good night after that.`,
    category: 'special-days'
  }

  const filteredPhotos = activeCategory === 'all' 
    ? photos 
    : photos.filter(photo => photo.category === activeCategory)

  const handleAddPhoto = (newPhoto: Omit<Photo, 'id'>) => {
    const photo = {
      ...newPhoto,
      id: Date.now().toString()
    }
    setPhotos(prev => [...prev, photo])
  }

  return (
    <div style={{
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      margin: '0',
      padding: '0',
      color: '#333',
      backgroundColor: '#f9f9f9',
      minHeight: '100vh'
    }}>
      <Header />
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 15px'
      }}>
        <FeaturedMemory photo={featuredPhoto} />
        <PhotoGrid 
          photos={filteredPhotos}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
      </div>

      <Footer />

      {/* Add Photo Button */}
      <div
        onClick={() => setIsModalOpen(true)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          backgroundColor: '#333',
          color: '#fff',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '30px',
          boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#555'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#333'
        }}
      >
        +
      </div>

      <AddPhotoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddPhoto={handleAddPhoto}
      />
    </div>
  )
} 