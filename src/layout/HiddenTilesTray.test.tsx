import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HiddenTilesTray } from './HiddenTilesTray'
import { useSettings } from '../store/settings'
import { useAppState } from '../store/appState'

describe('HiddenTilesTray', () => {
  beforeEach(() => {
    useSettings.getState().reset()
    useAppState.setState({ editMode: true })
  })

  it('shows a Done button that exits edit mode', async () => {
    render(<HiddenTilesTray />)
    await userEvent.click(screen.getByRole('button', { name: /done/i }))
    expect(useAppState.getState().editMode).toBe(false)
  })

  it('lists a re-add button only for user-hidden tiles', async () => {
    useSettings.getState().update({
      enabledTiles: { ...useSettings.getState().settings.enabledTiles, quote: false },
    })
    render(<HiddenTilesTray />)
    const addBtn = screen.getByRole('button', { name: /quote/i })
    await userEvent.click(addBtn)
    expect(useSettings.getState().settings.enabledTiles.quote).toBe(true)
  })

  it('lists nothing to re-add when all tiles are enabled', () => {
    render(<HiddenTilesTray />)
    // Done is present, but no "+ Clock" style buttons
    expect(screen.queryByRole('button', { name: /^\+/ })).toBeNull()
  })
})
