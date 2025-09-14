export function ChefHat({ className = "", stroke = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7 10H17V17C17 18.105 16.105 19 15 19H9C7.895 19 7 18.105 7 17V10Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 9C4.17157 9 3.5 8.32843 3.5 7.5C3.5 6.67157 4.17157 6 5 6C5.05023 6 5.09973 6.00201 5.14844 6.00596C5.68396 4.84068 6.87006 4 8.25 4C9.04925 4 9.77939 4.29361 10.3333 4.78596C10.8574 4.28822 11.5751 4 12.3333 4C13.7147 4 14.9021 4.84277 15.4357 6.00951C15.4776 6.00319 15.5201 6 15.563 6C16.668 6 17.563 6.895 17.563 8C17.563 8.351 17.474 8.683 17.314 8.977C18.257 9.116 19 9.932 19 10.906C19 11.967 18.141 12.833 17.082 12.864"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Sparkles({ className = "", stroke = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12 3L13.2 7.2L17.4 8.4L13.2 9.6L12 13.8L10.8 9.6L6.6 8.4L10.8 7.2L12 3Z" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M6 14L6.6 16.2L8.8 16.8L6.6 17.4L6 19.6L5.4 17.4L3.2 16.8L5.4 16.2L6 14Z" stroke={stroke} strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M18 14L18.6 16.2L20.8 16.8L18.6 17.4L18 19.6L17.4 17.4L15.2 16.8L17.4 16.2L18 14Z" stroke={stroke} strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  )
}

export function Loader({ className = "", stroke = "currentColor" }) {
  return (
    <svg
      className={className + " animate-spin"}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke={stroke} strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Clock({ className = "", stroke = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.6" />
      <path d="M12 7v6l4 2" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Users({ className = "", stroke = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M16 14a4 4 0 1 1 8 0v1.5c0 .8-.7 1.5-1.5 1.5H17.5c-.8 0-1.5-.7-1.5-1.5V14Z" stroke={stroke} strokeWidth="1.4" />
      <circle cx="8" cy="8" r="3" stroke={stroke} strokeWidth="1.4" />
      <path d="M2 18.5C2 16.6 4.7 15 8 15s6 1.6 6 3.5V20H2v-1.5Z" stroke={stroke} strokeWidth="1.4" />
    </svg>
  )
}

export function Mail({ className = "", stroke = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke={stroke} strokeWidth="1.6"/>
      <path d="m22 8-9.172 5.503a2 2 0 0 1-1.656 0L2 8" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
