
export interface Work {
  id: string
  type: string[]
  site?: string
  title: string
  subtitle?: string
  description?: string
  image: string
  role: string[]
  tech: string[]
  videos?: string[]
  colors?: any
  colorContext?: string[]
}

export const works: Work[] = [
  {
    id: 'silicon-pool',
    type: ['Web App'],
    site: 'silicon.net',
    title: 'Silicon',
    subtitle: 'cryptocurrency for datacenters',
    image: 'silicon.png',
    role: ['Frontend', 'Design', 'Backend'],
    tech: ['TypeScript', 'React', 'Tailwind CSS', 'Solidity', 'PostgreSQL', 'Supabase', 'AWS Lambda', 'Netlify', 'Ethereum'],
    videos: [],
    colors: {
      title: 'bg-purple-600 text-white',
      type: {
        label: 'text-green-600',
        bg: 'bg-green-600 text-white',
      },
      role: {
        label: 'text-green-600',
        bg: 'bg-green-600 text-white',
      },
      tech: {
        label: 'text-green-600',
        bg: 'bg-green-600 text-white',
      },
      site: 'hover:bg-purple-600 text-black border-purple-600',
      description: 'border-purple-600',
    },
    colorContext: ['#f0dcfa', '#fafafa', '#e4e4e4', '#d7e6d5']
  },
  {
    id: 'copytrading',
    type: ['Web App'],
    site: 'copytradingbotsarescams.netlify.app',
    title: 'Copytrading Scams',
    subtitle: 'copytrading bots do not work',
    image: 'copytrading.png',
    role: ['Frontend', 'Design', 'Backend'],
    tech: ['TypeScript', 'Tailwind CSS', 'Ethereum', 'React', 'PostgreSQL'],
    videos: [],
    colors: {
      title: 'bg-blue-600 text-white',
      type: {
        label: 'text-blue-600',
        bg: 'bg-blue-600 text-white',
      },
      role: {
        label: 'text-blue-600',
        bg: 'bg-blue-600 text-white',
      },
      tech: {
        label: 'text-blue-600',
        bg: 'bg-blue-600 text-white',
      },
      site: 'hover:bg-blue-600 text-black border-blue-600',
      description: 'border-blue-600',
    },
    colorContext: ['#d5e5f2', '#ced7f5', '#ceecf5', '#f0f0f0']
  },
  {
    id: 'old-portfolio',
    type: ['Website'],
    site: 'https://mjv11.github.io',
    title: 'Portfolio v1',
    subtitle: 'undergrad work',
    description: 'This is my old portfolio site that I built in 2023 in vanilla JS and HTML. It has many of the items I produced as an undergrad.',
    image: 'oldportfolio.png',
    role: ['Frontend', 'Design'],
    tech: ['JavaScript', 'HTML/CSS', 'Three.js', 'GLSL', 'GSAP'],
    videos: [],
    colors: {
      title: 'bg-[#72fafc] text-black',
      type: {
        label: 'text-[#86fc62]',
        bg: 'bg-[#86fc62] text-black',
      },
      role: {
        label: 'text-[#f5d922]',
        bg: 'bg-[#f5d922] text-black',
      },
      tech: {
        label: 'text-[#fc6262]',
        bg: 'bg-[#fc6262] text-black',
      },
      site: 'hover:bg-[#fc62e3] text-black border-[#fc62e3]',
      description: 'border-[#cf74fc]',
    },
    colorContext: ['#f2d5e3', '#f2f1d5', '#d7e6d5', '#d5e3f2'] // pastels for red, yellow, green, and blue, respectively
  },
]
