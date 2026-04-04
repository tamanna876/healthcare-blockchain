/**
 * Frontend API unit tests for the Health Education backend helpers.
 * Fetch is mocked so these tests stay isolated from the live backend.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getHealthEducationSupportPrograms,
  saveHealthEducationSupportProgram,
  getWomenHealthReminders,
  saveWomenHealthReminder,
} from '../services/api'

beforeEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
  window.localStorage.setItem('dhts_token', 'test-token')
})

describe('getHealthEducationSupportPrograms', () => {
  it('returns programs from backend response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        programs: [{ id: 'sp-1', programName: 'Test Program', providerType: 'central' }],
      }),
    }))

    const programs = await getHealthEducationSupportPrograms()
    expect(programs.length).toBeGreaterThan(0)
    expect(programs[0]).toHaveProperty('programName')
  })

  it('supports provider type query', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ programs: [] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await getHealthEducationSupportPrograms('who')
    expect(fetchMock.mock.calls[0][0]).toContain('/api/education/support-programs?providerType=who')
  })
})

describe('saveHealthEducationSupportProgram', () => {
  it('posts a support program and returns created record', async () => {
    const program = {
      id: 'test-1',
      providerType: 'central',
      provider: 'Test Gov',
      badge: 'Test Badge',
      coverage: 75,
      programName: 'Test Program',
      support: 'Test support text',
      link: 'https://example.com',
      accessSteps: ['Step 1', 'Step 2'],
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ program }),
    }))

    const saved = await saveHealthEducationSupportProgram(program)
    expect(saved.programName).toBe('Test Program')
  })
})

describe('Women health reminders', () => {
  it('saves a reminder through backend API', async () => {
    const reminder = {
      language: 'en',
      stage: 'reproductive',
      goal: 'energy',
      reminderType: 'Daily Check',
      reminderDate: '2024-06-01',
      notes: 'Test note',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ reminder: { id: 'wr-1', patientEmail: 'test@example.com', ...reminder } }),
    }))

    const saved = await saveWomenHealthReminder(reminder)
    expect(saved.goal).toBe('energy')
  })

  it('retrieves reminders from backend response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        reminders: [{ id: 'wr-1', patientEmail: 'a@example.com', stage: 'teen', goal: 'cycle' }],
      }),
    }))

    const reminders = await getWomenHealthReminders('a@example.com')
    expect(reminders.length).toBe(1)
    expect(reminders[0].patientEmail).toBe('a@example.com')
  })
})
