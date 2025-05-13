import * as icons from 'simple-icons'

interface SimpleIconProps {
  slug: keyof typeof icons
  size?: number
}

const SimpleIcon = ({ slug, size = 24 }: SimpleIconProps) => {
  const icon = icons[slug]
  if (!icon) return null

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={`#ffffff`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* @ts-ignore */}
      <path d={icon.path} />
    </svg>
  )
}

export default SimpleIcon
