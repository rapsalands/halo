import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
  accent?: string
  style?: CSSProperties
  className?: string
  /** How the tile distributes its content over the full card height. */
  justify?: CSSProperties['justifyContent']
}

export function TileFrame({ children, accent, style, className, justify = 'center' }: Props) {
  const vars = accent ? ({ ['--accent']: accent } as CSSProperties) : {}
  return (
    <motion.div
      className={`glass ${className ?? ''}`}
      style={{ justifyContent: justify, ...vars, ...style }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
