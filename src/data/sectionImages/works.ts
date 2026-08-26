/**
 * Works section carousel images.
 * Order is derived from the works array so that image N always
 * corresponds to works[N].
 */
import { works } from '../works'

const modules = import.meta.glob<{ default: string }>(
  '../../assets/images/works/*.{jpg,jpeg,png,JPG,JPEG,PNG}',
  { 
    eager: true, 
    query: { format: 'avif;webp;jpg' }
  },
)

const byFilename = new Map<string, string>()
for (const [path, mod] of Object.entries(modules)) {
  const filename = path.split('/').pop()!
  byFilename.set(filename, (mod as { default: string }).default)
}

export default works.map((w) => {
  const url = byFilename.get(w.image)
  if (!url) console.warn(`[works images] no file found for "${w.image}"`)
  return url!
}).filter(Boolean)
