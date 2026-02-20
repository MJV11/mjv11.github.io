/**
 * Contact section carousel images.
 */
const modules = import.meta.glob<{ default: string }>(
  '../../assets/images/contact/*.{jpg,jpeg,png,JPG,JPEG,PNG}',
  { eager: true },
)

export default Object.values(modules).map((mod) => (mod as { default: string }).default)
