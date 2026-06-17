import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OnboardingBanner } from './OnboardingBanner'
import { useSettings } from '../store/settings'

describe('OnboardingBanner', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettings.getState().reset()
  })

  it('shows a kiosk hint by default', () => {
    render(<OnboardingBanner />)
    expect(screen.getByText(/two fingers/i)).toBeInTheDocument()
  })

  it('renders nothing when the setting is off', () => {
    useSettings.getState().update({ showOnboardingBanner: false })
    const { container } = render(<OnboardingBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('dismiss button turns the setting off and hides the banner', () => {
    render(<OnboardingBanner />)
    fireEvent.click(screen.getByRole('button', { name: /hide this banner/i }))
    expect(useSettings.getState().settings.showOnboardingBanner).toBe(false)
    expect(screen.queryByText(/two fingers/i)).not.toBeInTheDocument()
  })
})
