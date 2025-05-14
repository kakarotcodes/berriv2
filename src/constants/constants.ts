export const WIDTH = {
  DEFAULT: 512,
  PILL: 35,
  HOVER: 384
}

export const HEIGHT = {
  DEFAULT: 288,
  PILL: 200,
  HOVER: 500
}

export const OFFSET = {
  PILLOFFSET: 50
}

// Smoother spring physics
export const viewTransition = {
  type: 'spring',
  stiffness: 180, // Softer spring
  damping: 28, // Slightly more damping
  mass: 1,
  velocity: 0.1,
  restDelta: 0.001
}

// Enhanced view variants with spatial movement
export const viewVariants = {
  hidden: {
    opacity: 0,
    scale: 0.98,
    y: 8, // Add vertical offset
    transition: { duration: 0.16, ease: [0.4, 0, 0.2, 1] }
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.16, ease: [0.4, 0, 0.2, 1] }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -8, // Directional exit
    transition: { duration: 0.16, ease: [0.4, 0, 0.2, 1] }
  }
}

// Component fade animation
export const componentFade = {
  hidden: {
    opacity: 0,
    transition: {
      duration: 0.12, // Increased from 0.1
      ease: [0.4, 0, 0.2, 1]
    }
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.12, // Increased from 0.1
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.12, // Increased from 0.1
      ease: [0.4, 0, 0.2, 1]
    }
  }
}

// Transition overlay config
export const overlayTransition = {
  enter: {
    duration: 0.12, // Increased from 0.1
    ease: [0.4, 0, 0.2, 1]
  },
  exit: {
    duration: 0.12, // Increased from 0.1
    ease: [0.4, 0, 0.2, 1]
  }
}
