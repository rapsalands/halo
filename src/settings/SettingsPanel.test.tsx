import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPanel } from './SettingsPanel'
import { useSettings } from '../store/settings'
import { useAppState } from '../store/appState'
import { DEFAULT_LAYOUT, DEFAULT_SETTINGS } from '../store/defaults'

async function openPanel() {
  render(<SettingsPanel />)
  await userEvent.click(screen.getByRole('button', { name: /settings/i }))
}
async function selectTab(name: RegExp) {
  await userEvent.click(screen.getByRole('tab', { name }))
}

describe('SettingsPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettings.getState().reset()
    useAppState.setState({ editMode: false })
  })

  it('opens when the gear button is clicked', async () => {
    render(<SettingsPanel />)
    expect(screen.queryByTestId('settings-overlay')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByTestId('settings-overlay')).toBeInTheDocument()
  })

  it('shows six category tabs and opens on Display', async () => {
    await openPanel()
    expect(screen.getAllByRole('tab')).toHaveLength(6)
    expect(screen.getByRole('tab', { name: /display/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('changes the accent color (Display tab)', async () => {
    await openPanel()
    await userEvent.click(screen.getByRole('button', { name: /accent #9db4ff/i }))
    expect(useSettings.getState().settings.accent).toBe('#9db4ff')
  })

  it('changes units (Clock tab)', async () => {
    await openPanel()
    await selectTab(/clock/i)
    await userEvent.click(screen.getByRole('button', { name: /imperial/i }))
    expect(useSettings.getState().settings.units).toBe('imperial')
  })

  it('toggles a tile and persists it (Tiles tab)', async () => {
    await openPanel()
    await selectTab(/tiles/i)
    await userEvent.click(screen.getByLabelText(/^ticker$/i))
    expect(useSettings.getState().settings.enabledTiles.ticker).toBe(false)
  })

  it('changes ticker currency (Ticker tab)', async () => {
    await openPanel()
    await selectTab(/ticker/i)
    await userEvent.click(screen.getByRole('button', { name: /^eur$/i }))
    expect(useSettings.getState().settings.tickerCurrency).toBe('eur')
  })

  it('shows the live scene chips on the Advanced tab', async () => {
    await openPanel()
    await selectTab(/advanced/i)
    expect(screen.getByRole('button', { name: /live/i })).toBeInTheDocument()
  })

  it('arrow keys move between tabs', async () => {
    await openPanel()
    screen.getByRole('tab', { name: /display/i }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: /clock/i })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('SettingsPanel — Tiles tab layout controls', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettings.getState().reset()
    useAppState.setState({ editMode: false })
  })

  it('lists Photo and Forecast among the tile toggles', async () => {
    await openPanel()
    await selectTab(/tiles/i)
    expect(screen.getByText('Photo')).toBeInTheDocument()
    expect(screen.getByText('Forecast')).toBeInTheDocument()
  })

  it('Edit layout enters edit mode and closes the drawer', async () => {
    await openPanel()
    await selectTab(/tiles/i)
    await userEvent.click(screen.getByRole('button', { name: /edit layout/i }))
    expect(useAppState.getState().editMode).toBe(true)
    expect(screen.queryByTestId('settings-overlay')).toBeNull()
  })

  it('Reset to default layout restores the default layout', async () => {
    useSettings.getState().update({ tileLayout: [{ i: 'clock', x: 9, y: 9, w: 1, h: 1 }] })
    await openPanel()
    await selectTab(/tiles/i)
    await userEvent.click(screen.getByRole('button', { name: /reset to default layout/i }))
    expect(useSettings.getState().settings.tileLayout).toEqual(DEFAULT_LAYOUT)
    expect(useSettings.getState().settings.enabledTiles).toEqual(DEFAULT_SETTINGS.enabledTiles)
  })
})
