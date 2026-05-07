import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import GenerationBanner from './GenerationBanner.jsx'

beforeAll(() => {
  global.URL.createObjectURL = vi.fn(() => 'blob:mock')
  global.URL.revokeObjectURL = vi.fn()
  Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
})

const working = (id, name) => ({ id, name, type: 'docx', status: 'working' })
const done = (id, name) => ({ id, name, type: 'docx', status: 'done', data: new Uint8Array() })
const failed = (id, name) => ({ id, name, type: 'docx', status: 'error', error: 'Timeout' })
const prompt = (id, name) => ({ id, name, type: 'prompt', status: 'prompt', data: 'prompt text' })

describe('GenerationBanner', () => {
  it('renders nothing when there are no results', () => {
    const { container } = render(<GenerationBanner results={[]} generating={false} projectSlug="test" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a working status while generating', () => {
    render(<GenerationBanner results={[working('raid', 'RAID log')]} generating={true} projectSlug="test" />)
    expect(screen.getByText(/Generating…/)).toBeInTheDocument()
    expect(screen.getByText('RAID log')).toBeInTheDocument()
  })

  it('shows a ready count when generation is complete', () => {
    render(<GenerationBanner results={[done('raid', 'RAID log'), done('raci', 'RACI matrix')]} generating={false} projectSlug="test" />)
    expect(screen.getByText('2 artefacts ready')).toBeInTheDocument()
  })

  it('shows singular "artefact" when only one is ready', () => {
    render(<GenerationBanner results={[done('raid', 'RAID log')]} generating={false} projectSlug="test" />)
    expect(screen.getByText('1 artefact ready')).toBeInTheDocument()
  })

  it('reports failed count in the status line', () => {
    render(<GenerationBanner results={[done('raid', 'RAID log'), failed('raci', 'RACI matrix')]} generating={false} projectSlug="test" />)
    expect(screen.getByText(/1 failed/)).toBeInTheDocument()
  })

  it('shows "Retry failed" button when there are errors and not generating', () => {
    render(<GenerationBanner results={[failed('raid', 'RAID log')]} generating={false} projectSlug="test" />)
    expect(screen.getByText('Retry failed')).toBeInTheDocument()
  })

  it('does not show "Retry failed" while still generating', () => {
    render(<GenerationBanner results={[failed('raid', 'RAID log')]} generating={true} projectSlug="test" />)
    expect(screen.queryByText('Retry failed')).not.toBeInTheDocument()
  })

  it('calls onRegenerateOne for each failed item when "Retry failed" is clicked', () => {
    const onRegenerateOne = vi.fn()
    const results = [failed('raid', 'RAID log'), failed('raci', 'RACI matrix')]
    render(<GenerationBanner results={results} generating={false} projectSlug="test" onRegenerateOne={onRegenerateOne} />)
    fireEvent.click(screen.getByText('Retry failed'))
    expect(onRegenerateOne).toHaveBeenCalledTimes(2)
    expect(onRegenerateOne).toHaveBeenCalledWith('raid')
    expect(onRegenerateOne).toHaveBeenCalledWith('raci')
  })

  it('shows copy button for prompt-type results', () => {
    render(<GenerationBanner results={[prompt('confluence', 'Confluence space')]} generating={false} projectSlug="test" />)
    expect(screen.getByTitle('Copy Rovo prompt')).toBeInTheDocument()
  })

  it('collapses and expands the chip list', () => {
    render(<GenerationBanner results={[done('raid', 'RAID log')]} generating={false} projectSlug="test" />)
    expect(screen.getByText('RAID log')).toBeInTheDocument()
    fireEvent.click(screen.getByTitle('Collapse'))
    expect(screen.queryByText('RAID log')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTitle('Show artefacts'))
    expect(screen.getByText('RAID log')).toBeInTheDocument()
  })
})
