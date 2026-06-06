interface Props { sky: [string, string] }

/** Full-screen background gradient. Transitions are handled by CSS. */
export function SkyGradient({ sky }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 100%)`,
        transition: 'background 2s ease',
      }}
    />
  )
}
