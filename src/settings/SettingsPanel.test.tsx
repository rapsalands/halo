import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPanel } from './SettingsPanel'
import { useSettings } from '../store/settings'
import { useAppState } from '../store/appState'
import { DEFAULT_LAYOUT, DEFAULT_SETTINGS } from '../store/defaults'

describe('SettingsPanel', () => {
  beforeEach(() => { localStorage.clear(); useSettings.getState().reset() })

  it('opens when the gear button is clicked', async () => {
    render(<SettingsPanel />)
    expect(screen.queryByTestId('settings-overlay')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByTestId('settings-overlay')).toBeInTheDocument()
  })

  it('toggles a tile and persists it', async () => {
    render(<SettingsPanel />)
    await userEvent.click(screen.getByRole('button', { name: /settings/i }))
    const ticker = screen.getByLabelText(/ticker/i)
    await userEvent.click(ticker)
    expect(useSettings.getState().settings.enabledTiles.ticker).toBe(false)
  })

  it('changes units', async () => {
    render(<SettingsPanel />)
    await userEvent.click(screen.getByRole('button', { name: /settings/i }))
    await userEvent.click(screen.getByRole('button', { name: /imperial/i }))
    expect(useSettings.getState().settings.units).toBe('imperial')
  })

  it('changes the accent color', async () => {
    render(<SettingsPanel />)
    await userEvent.click(screen.getByRole('button', { name: /settings/i }))
    await userEvent.click(screen.getByRole('button', { name: /accent #9db4ff/i }))
    expect(useSettings.getState().settings.accent).toBe('#9db4ff')
  })
})

describe('SettingsPanel — layout controls', () => {
  beforeEach(() => {
    useSettings.getState().reset()
    useAppState.setState({ editMode: false })
  })

  async function openPanel() {
    render(<SettingsPanel />)
    await userEvent.click(screen.getByRole('button', { name: /settings/i }))
  }

  it('lists Photo and Forecast among the tile toggles', async () => {
    await openPanel()
    expect(screen.getByText('Photo')).toBeInTheDocument()
    expect(screen.getByText('Forecast')).toBeInTheDocument()
  })

  it('Edit layout enters edit mode and closes the drawer', async () => {
    await openPanel()
    await userEvent.click(screen.getByRole('button', { name: /edit layout/i }))
    expect(useAppState.getState().editMode).toBe(true)
    expect(screen.queryByTestId('settings-overlay')).toBeNull()
  })

  it('Reset to default layout restores the default layout', async () => {
    useSettings.getState().update({ tileLayout: [{ i: 'clock', x: 9, y: 9, w: 1, h: 1 }] })
    await openPanel()
    await userEvent.click(screen.getByRole('button', { name: /reset to default layout/i }))
    expect(useSettings.getState().settings.tileLayout).toEqual(DEFAULT_LAYOUT)
    expect(useSettings.getState().settings.enabledTiles).toEqual(DEFAULT_SETTINGS.enabledTiles)
  })
})
