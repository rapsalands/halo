import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClockTile } from './ClockTile'
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'

describe('ClockTile', () => {
  beforeEach(() => {
    useAppState.setState({ now: new Date('2026-06-06T14:05:00') })
    useSettings.getState().reset()
  })

  it('shows the 24h time and long date', () => {
    render(<ClockTile />)
    expect(screen.getByText('14:05')).toBeInTheDocument()
    expect(screen.getByText('Saturday · June 6')).toBeInTheDocument()
  })

  it('respects the 12-hour setting', () => {
    useSettings.getState().update({ hour12: true })
    render(<ClockTile />)
    expect(screen.getByText('2:05')).toBeInTheDocument()
  })
})
