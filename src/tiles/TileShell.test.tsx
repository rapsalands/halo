import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TileShell } from './TileShell'

describe('TileShell', () => {
  it('renders content with a data-region marker', () => {
    const { container } = render(
      <TileShell id="clock" editMode={false} onRemove={() => {}}>
        <span>hello</span>
      </TileShell>,
    )
    expect(container.querySelector('[data-region="clock"]')).toBeInTheDocument()
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('shows no remove button outside edit mode', () => {
    render(<TileShell id="clock" editMode={false} onRemove={() => {}}><span>x</span></TileShell>)
    expect(screen.queryByRole('button', { name: /remove/i })).toBeNull()
  })

  it('removes the tile when the × is clicked in edit mode', async () => {
    const onRemove = vi.fn()
    render(<TileShell id="quote" editMode onRemove={onRemove}><span>x</span></TileShell>)
    await userEvent.click(screen.getByRole('button', { name: /remove quote/i }))
    expect(onRemove).toHaveBeenCalledWith('quote')
  })

  it('forwards injected className/style/props to the root (RGL compatibility)', () => {
    const { container } = render(
      <TileShell id="air" editMode={false} onRemove={() => {}} className="react-grid-item" style={{ width: 120 }}>
        <span>x</span>
      </TileShell>,
    )
    const root = container.querySelector('[data-region="air"]') as HTMLElement
    expect(root.className).toContain('react-grid-item')
    expect(root.style.width).toBe('120px')
  })
})
