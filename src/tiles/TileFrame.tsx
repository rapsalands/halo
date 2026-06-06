import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
  accent?: string
  style?: CSSProperties
  className?: string
}

export function TileFrame({ children, accent, style, className }: Props) {
  const vars = accent ? ({ ['--accent']: accent } as CSSProperties) : {}
  return (
    <motion.div
      className={`glass ${className ?? ''}`}
      style={{ ...vars, ...style }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
