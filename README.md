# Trin and Basti Adventures

Our website that contains our memories together in a Photo Album.

## Features

- **Modern Design**: Clean, responsive design with smooth animations
- **Photo Gallery**: Organized photo grid with category filtering
- **Featured Memory**: Special highlight for the most important moment
- **Interactive**: Add new memories with a beautiful modal interface
- **Responsive**: Works perfectly on all devices
- **Fast Loading**: Optimized images and performance

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Framer Motion** - Smooth animations and transitions
- **Next.js Image** - Optimized image loading and performance

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
Trin-and-Basti-Adventures/
├── next-env.d.ts           # Next.js TypeScript declarations
├── next.config.js          # Next.js configuration
├── package-lock.json       # Package lock file
├── package.json            # Dependencies and scripts
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── vercel.json             # Vercel deployment configuration
├── README.md               # Project documentation
├── public/                 # Static assets (photos)
└── src/
    ├── app/
    │   ├── layout.tsx      # Root layout with metadata and fonts
    │   ├── page.tsx        # Home page entry point
    │   └── globals.css     # Global Tailwind styles
    └── components/
        ├── AdventuresPage.tsx   # Main page component with photo data
        ├── Header.tsx           # Site header with relationship timer
        ├── FeaturedMemory.tsx   # Featured photo display with location
        ├── PhotoGrid.tsx        # Photo grid with category filtering
        ├── PhotoCard.tsx        # Individual photo cards with clickable locations
        ├── AddPhotoModal.tsx    # Modal for adding new photos with location
        └── Footer.tsx           # Site footer
```

## Deployment

This project is configured for deployment on Vercel:

1. Connect your repository to Vercel
2. Deploy automatically on every push to main
3. Enjoy your beautiful photo album!

## Adding New Photos

1. Add your image files to the `public/images/` directory
2. Use the "+" button on the site to add new memories
3. Or edit the `initialPhotos` array in `AdventuresPage.tsx`

## Customization

- Edit the header message in `Header.tsx`
- Modify the featured photo in `AdventuresPage.tsx`
- Add new categories in `PhotoGrid.tsx`
- Customize colors and styling in the component files

Built with ❤️ for my beautiful Princess!
