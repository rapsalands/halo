import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InformationBanner } from './InformationBanner'
import { useSettings } from '../store/settings'

describe('InformationBanner', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettings.getState().reset()
  })

  it('shows a kiosk hint by default', () => {
    render(<InformationBanner />)
    expect(screen.getByText(/two fingers/i)).toBeInTheDocument()
  })

  it('renders nothing when the setting is off', () => {
    useSettings.getState().update({ showInformationBanner: false })
    const { container } = render(<InformationBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('dismiss button turns the setting off and hides the banner', () => {
    render(<InformationBanner />)
    fireEvent.click(screen.getByRole('button', { name: /hide this banner/i }))
    expect(useSettings.getState().settings.showInformationBanner).toBe(false)
    expect(screen.queryByText(/two fingers/i)).not.toBeInTheDocument()
  })
})
