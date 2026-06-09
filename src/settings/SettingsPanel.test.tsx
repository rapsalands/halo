import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPanel } from './SettingsPanel'
import { useSettings } from '../store/settings'

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
