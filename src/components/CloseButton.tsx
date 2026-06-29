import type { CSSProperties } from 'react'

/** Small, unobtrusive "×" dismiss button. Transparent by default so it sits on
 * top of whatever surface it's placed on; pass `style` to position it. */
export function CloseButton({
  onClick,
  label,
  style,
}: {
  onClick: () => void
  label: string
  style?: CSSProperties
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        background: 'transparent', border: 0, cursor: 'pointer',
        color: 'rgba(255, 255, 255, 0.6)', fontSize: '1.2rem', lineHeight: 1,
        ...style,
      }}
    >
      ×
    </button>
  )
}
