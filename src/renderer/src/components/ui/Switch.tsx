// dependencies
import React from 'react'
import { default as ReactSwitch } from 'react-switch'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  size?: 'small' | 'default'
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, size = 'default' }) => {
  // Size configurations
  const dimensions = {
    small: {
      width: 28,
      height: 16,
      handleDiameter: 12
    },
    default: {
      width: 40,
      height: 20,
      handleDiameter: 16
    }
  }

  const { width, height, handleDiameter } = dimensions[size]

  return (
    <ReactSwitch
      onChange={onChange}
      checked={checked}
      className="react-switch"
      width={width}
      height={height}
      handleDiameter={handleDiameter}
      offColor="#888"
      onColor="#28C840" // Indigo color for on state
      uncheckedIcon={false}
      checkedIcon={false}
    />
  )
}

export default Switch
