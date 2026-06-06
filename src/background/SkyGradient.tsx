interface Props { sky: [string, string]; accent?: string }

/** Full-screen background gradient with a soft overhead light glow for depth. */
export function SkyGradient({ sky, accent }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 100%)`,
        transition: 'background 2s ease',
      }}
    >
      {/* soft radial light from upper area adds atmosphere and kills the flat look */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(120% 80% at 70% -10%, ${accent ?? '#ffffff'}33 0%, transparent 55%)`,
          transition: 'background 2s ease',
        }}
      />
      {/* gentle vignette to focus the centre */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(130% 120% at 50% 45%, transparent 55%, rgba(0,0,0,0.35) 100%)',
        }}
      />
    </div>
  )
}
