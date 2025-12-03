export function Logo() {
  return (
    <svg viewBox="0 0 200 200" className="w-16 h-16" fill="none">
      {/* Tent */}
      <path d="M100 20 L140 80 L60 80 Z" stroke="#0d9488" strokeWidth="2" fill="none" />
      <path d="M100 20 V80" stroke="#0d9488" strokeWidth="2" />

      {/* African continent */}
      <g opacity="0.6">
        <ellipse cx="120" cy="120" rx="35" ry="40" stroke="#ea580c" strokeWidth="2" fill="none" />
        <circle cx="130" cy="105" r="8" stroke="#ea580c" strokeWidth="1" fill="none" />
      </g>
    </svg>
  )
}
