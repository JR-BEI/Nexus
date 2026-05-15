import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageShell } from './PageShell'

describe('<PageShell />', () => {
  it('renders the required shell structure', () => {
    const { container } = render(
      <PageShell
        titlePrefix="Job Search"
        titleAccent="Tracker"
        subtitle="Subtitle copy"
        status="Local · Your data stays in your browser"
      >
        <div data-testid="child">content</div>
      </PageShell>
    )

    expect(container.querySelector('main.container-shell')).not.toBeNull()
    expect(container.querySelector('.page-header')).not.toBeNull()
    expect(container.querySelector('.status-pill .status-dot')).not.toBeNull()
    expect(container.querySelector('h1.page-title')).not.toBeNull()
    expect(container.querySelector('.gradient-text')).not.toBeNull()
    expect(container.querySelector('.page-subtitle')).not.toBeNull()
    expect(container.querySelector('.back-link')).not.toBeNull()
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('renders the title accent inside the gradient-text span (one per page rule)', () => {
    const { container } = render(
      <PageShell
        titlePrefix="Target"
        titleAccent="Companies"
        subtitle=""
        status=""
      >
        <div />
      </PageShell>
    )
    const gradients = container.querySelectorAll('.gradient-text')
    expect(gradients).toHaveLength(1)
    expect(gradients[0]).toHaveTextContent('Companies')
    // The prefix should be plain text (not inside gradient-text)
    expect(container.querySelector('.page-title')?.textContent).toContain('Target')
  })

  it('renders the icon prop inside .page-title-icon when provided', () => {
    const { container } = render(
      <PageShell
        icon={<svg data-testid="icon" />}
        titlePrefix="Build"
        titleAccent="Repository"
        subtitle=""
        status=""
      >
        <div />
      </PageShell>
    )
    const slot = container.querySelector('.page-title-icon')
    expect(slot).not.toBeNull()
    expect(slot?.querySelector('[data-testid="icon"]')).not.toBeNull()
  })

  it('renders headerAction in its dedicated slot', () => {
    const { container } = render(
      <PageShell
        titlePrefix="Job Search"
        titleAccent="Tracker"
        subtitle=""
        status=""
        headerAction={<button data-testid="action">Import</button>}
      >
        <div />
      </PageShell>
    )
    const slot = container.querySelector('.page-header-action')
    expect(slot).not.toBeNull()
    expect(slot?.querySelector('[data-testid="action"]')).not.toBeNull()
  })

  it('omits the header-action slot when no headerAction is passed', () => {
    const { container } = render(
      <PageShell titlePrefix="A" titleAccent="B" subtitle="" status="">
        <div />
      </PageShell>
    )
    expect(container.querySelector('.page-header-action')).toBeNull()
  })

  it('uses custom backHref and backLabel when provided', () => {
    render(
      <PageShell
        titlePrefix="A"
        titleAccent="B"
        subtitle=""
        status=""
        backHref="/somewhere"
        backLabel="Back to Home"
      >
        <div />
      </PageShell>
    )
    const link = screen.getByRole('link', { name: /Back to Home/ })
    expect(link).toHaveAttribute('href', '/somewhere')
  })
})
