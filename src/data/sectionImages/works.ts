/**
 * Works section carousel images.
 * Loaded on initial site load via PortfolioImagesProvider.
 */
const modules = import.meta.glob<{ default: string }>(
  '../../assets/images/works/*.{jpg,jpeg,png,JPG,JPEG,PNG}',
  { eager: true }
)
export default (Object.values(modules) as { default: string }[])
  .map((m) => m.default)
  .sort()
