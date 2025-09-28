import React from 'react'

export default function Switch({ checked, onChange, label, id, disabled=false }) {
  const switchId = id || `sw-${Math.random().toString(36).slice(2)}`
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      id={switchId}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); !disabled && onChange(!checked) }
      }}
      className={[
        'relative inline-flex items-center h-6 w-11 shrink-0 cursor-pointer rounded-full px-[2px] transition-colors focus:outline-none border-0 select-none',
        checked ? 'bg-neutral-900' : 'bg-neutral-300/90',
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      ].join(' ')}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <span
        className={[
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white transition-transform duration-200 ease-out will-change-transform border-0',
          checked ? 'translate-x-[20px]' : 'translate-x-0'
        ].join(' ')}
      />
      {label && <span className="sr-only">{label}</span>}
    </button>
  )
}