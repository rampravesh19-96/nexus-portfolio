export const contact = {
  email: 'hello@nexus.studio', // Editable placeholder. Replace before publishing.
  social: [
    { label: 'GITHUB', href: '' }, // Add a real destination when available.
    { label: 'LINKEDIN', href: '' },
    { label: 'ARE.NA', href: '' },
  ],
}

export const projects = [
  {
    id: 'velora',
    name: 'VELORA',
    category: 'REACT DASHBOARD / COMMERCE',
    description: 'A commerce dashboard that brings revenue, order status and store activity into a single data-led workspace. The live demo is populated with sample order records.',
    overview: 'VELORA presents store activity through revenue and order summaries, an order-status breakdown, and a recent-orders view. Sample figures and history are presented as demo data in the dashboard.',
    role: 'Not stated on the live site',
    capabilities: ['Dashboard interface', 'Revenue and order summaries', 'Data-oriented UI'],
    technologies: ['React'],
    image: '/projects/velora/desktop.jpg',
    mobileImage: '/projects/velora/mobile.jpg',
    imageAlt: 'VELORA commerce dashboard showing its navigation, store metrics, revenue overview and order status.',
    mobileImageAlt: 'VELORA dashboard at a mobile viewport, with store metrics arranged in a single column.',
    accent: '#8d5cff',
    link: 'https://velora-ten-pi.vercel.app/',
  },
  {
    id: 'aether',
    name: 'AETHER',
    category: 'INDEPENDENT DIGITAL STUDIO / PORTFOLIO',
    description: 'A dark, motion-led studio portfolio pairing an oversized editorial statement with a sculptural 3D form and concept-led selected work.',
    overview: 'AETHER introduces an independent digital studio through a sculptural, dark hero and a paced portfolio of clearly labeled fictional concepts. Its public capabilities list includes 3D, motion, interaction, responsive design, accessibility and performance.',
    role: 'Not stated on the live site',
    capabilities: ['Three-dimensional visual', 'Motion-led presentation', 'Concept-led storytelling'],
    technologies: ['React', 'TypeScript', 'GSAP', 'ScrollTrigger', 'Three.js', 'React Three Fiber'],
    image: '/projects/aether/desktop.jpg',
    mobileImage: '/projects/aether/mobile.jpg',
    imageAlt: 'AETHER dark studio hero with its “Beyond the ordinary web” headline and glossy sculptural form.',
    mobileImageAlt: 'AETHER mobile hero with a stacked headline and sculptural 3D visual.',
    accent: '#8295ff',
    link: 'https://aether-beta-weld.vercel.app/',
  },
  {
    id: 'orve',
    name: 'ORVÉ',
    category: 'LUXURY E-COMMERCE / STOREFRONT',
    description: 'A warm editorial storefront for considered objects, with a still-life hero, curated categories and a product-led visual language.',
    overview: 'The storefront opens with a sculptural still life and an editorial introduction, then presents Objects, Living, Adornment and Scent alongside product and journal content. Wishlist and bag entry points appear in the navigation.',
    role: 'Not stated on the live site',
    capabilities: ['Product discovery', 'Editorial product presentation', 'Wishlist and bag entry points'],
    technologies: [],
    image: '/projects/orve/desktop.jpg',
    mobileImage: '/projects/orve/mobile.jpg',
    imageAlt: 'ORVÉ editorial storefront featuring a sculptural burgundy vessel and chrome orb beside its headline.',
    mobileImageAlt: 'ORVÉ mobile storefront showing the editorial headline and sculptural still-life product image.',
    accent: '#a56b73',
    link: 'https://orve-lilac.vercel.app/',
  },
]

// Public implementation details are listed only when the live project identifies them.
// ORVÉ does not publish its framework or tooling on the inspected site.
