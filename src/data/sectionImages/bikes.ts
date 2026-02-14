/**
 * Bike section carousel images.
 * Loaded on demand when the section is active (or when preloaded).
 */
const modules = import.meta.glob<{ default: string }>(
  '../../assets/images/bikes/*.{jpg,jpeg,png,JPG,JPEG,PNG}',
  { eager: true }
)
export default (Object.values(modules) as { default: string }[])
  .map((m) => m.default)
  .sort()
