import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import { useTrackedTransaction } from '../hooks/useTrackedTransaction.js'

vi.mock('../services/api.js', () => ({
  getGasEstimate: vi.fn(),
  getTransactionNetwork: vi.fn(),
  getTransactionStatus: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { getGasEstimate, getTransactionNetwork, getTransactionStatus } from '../services/api.js'

function HookHarness({ submit }) {
  const { transaction, executeTransaction, markTransactionFailed } = useTrackedTransaction()

  return (
    <div>
      <button
        type="button"
        onClick={() => executeTransaction({ txType: 'unit-test', payload: { id: 1 }, submit })}
      >
        run
      </button>
      <button type="button" onClick={() => markTransactionFailed('manual-failure')}>
        fail
      </button>
      <pre data-testid="tx">{JSON.stringify(transaction)}</pre>
    </div>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useTrackedTransaction hook behavior', () => {
  it('tracks and confirms an on-chain transaction', async () => {
    getTransactionNetwork.mockResolvedValue({ networkName: 'testnet' })
    getGasEstimate.mockResolvedValue({ estimatedGas: '21000' })
    getTransactionStatus.mockResolvedValueOnce({ status: 'confirmed' })

    const submit = vi.fn().mockResolvedValue({ txHash: '0xabc' })

    render(<HookHarness submit={submit} />)
    fireEvent.click(screen.getByText('run'))

    await waitFor(() => {
      const tx = JSON.parse(screen.getByTestId('tx').textContent)
      expect(tx.status).toBe('confirmed')
      expect(tx.txHash).toBe('0xabc')
      expect(tx.networkName).toBe('testnet')
      expect(tx.estimatedGas).toBe('21000')
    })
  })

  it('marks off-chain submission as confirmed with off-chain hash', async () => {
    getTransactionNetwork.mockResolvedValue({ networkName: 'testnet' })
    getGasEstimate.mockResolvedValue({ estimatedGas: '12345' })

    const submit = vi.fn().mockResolvedValue({ id: 'local-only' })

    render(<HookHarness submit={submit} />)
    fireEvent.click(screen.getByText('run'))

    await waitFor(() => {
      const tx = JSON.parse(screen.getByTestId('tx').textContent)
      expect(tx.status).toBe('confirmed')
      expect(tx.txHash).toBe('off-chain-only')
    })
  })

  it('supports manual failed state updates', async () => {
    const submit = vi.fn().mockResolvedValue({ txHash: '0xnever-used' })

    render(<HookHarness submit={submit} />)
    fireEvent.click(screen.getByText('fail'))

    await waitFor(() => {
      const tx = JSON.parse(screen.getByTestId('tx').textContent)
      expect(tx.status).toBe('failed')
      expect(tx.error).toBe('manual-failure')
    })
  })
})
