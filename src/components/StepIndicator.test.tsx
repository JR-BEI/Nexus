import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StepIndicator } from './StepIndicator'

describe('<StepIndicator />', () => {
  it('marks earlier steps complete, the current step active, later steps pending', () => {
    const { container } = render(<StepIndicator currentStep={2} />)
    const circles = container.querySelectorAll('.step-circle')
    expect(circles).toHaveLength(3)
    expect(circles[0].classList.contains('step-complete')).toBe(true)
    expect(circles[1].classList.contains('step-active')).toBe(true)
    expect(circles[2].classList.contains('step-pending')).toBe(true)
  })

  it('renders a check svg inside completed steps and the number inside non-completed steps', () => {
    const { container } = render(<StepIndicator currentStep={3} />)
    const circles = container.querySelectorAll('.step-circle')
    // first two are complete -> contain svg
    expect(circles[0].querySelector('svg')).not.toBeNull()
    expect(circles[1].querySelector('svg')).not.toBeNull()
    // third is active -> renders text "3"
    expect(circles[2].textContent?.trim()).toBe('3')
  })

  it('uses default labels Input / Analysis / Outputs', () => {
    const { container } = render(<StepIndicator currentStep={1} />)
    const labels = Array.from(container.querySelectorAll('.step-label')).map((n) => n.textContent)
    expect(labels).toEqual(['Input', 'Analysis', 'Outputs'])
  })

  it('renders connectors with the complete modifier only between two completed steps', () => {
    const { container } = render(<StepIndicator currentStep={3} />)
    const connectors = container.querySelectorAll('.step-connector')
    expect(connectors).toHaveLength(2)
    expect(connectors[0].classList.contains('step-connector-complete')).toBe(true)
    // Step 2 is complete when currentStep=3, so connector after step 2 is also complete
    expect(connectors[1].classList.contains('step-connector-complete')).toBe(true)
  })

  it('leaves the connector after the active step in pending state', () => {
    const { container } = render(<StepIndicator currentStep={2} />)
    const connectors = container.querySelectorAll('.step-connector')
    // After step 1 (complete) -> complete; after step 2 (active) -> pending
    expect(connectors[0].classList.contains('step-connector-complete')).toBe(true)
    expect(connectors[1].classList.contains('step-connector-pending')).toBe(true)
  })
})
