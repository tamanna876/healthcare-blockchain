import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { getGasEstimate, getTransactionNetwork, getTransactionStatus } from '../services/api.js'

export function useTrackedTransaction() {
  const [transaction, setTransaction] = useState(null)

  const pollTransactionUntilSettled = async (txHash) => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const txInfo = await getTransactionStatus(txHash)
      if (txInfo?.status === 'confirmed') return { status: 'confirmed' }
      if (txInfo?.status === 'failed') return { status: 'failed' }
      await new Promise((resolve) => setTimeout(resolve, 2500))
    }
    return { status: 'pending' }
  }

  const executeTransaction = async ({ txType, payload, submit, getTxHash }) => {
    const [network, estimate] = await Promise.all([
      getTransactionNetwork().catch(() => null),
      getGasEstimate(txType, payload).catch(() => null),
    ])

    setTransaction({
      txHash: null,
      status: 'pending',
      estimatedGas: estimate?.estimatedGas || estimate?.gasPriceWei || 'n/a',
      networkName: network?.networkName || 'unknown',
      payload,
    })

    const response = await submit(payload)
    const txHash =
      typeof getTxHash === 'function'
        ? getTxHash(response)
        : response?.txHash || response?.transactionHash || null

    if (txHash) {
      setTransaction((prev) => ({ ...prev, txHash, status: 'pending' }))
      toast.loading('Blockchain transaction pending confirmation...', { id: txHash })
      const finalState = await pollTransactionUntilSettled(txHash)

      if (finalState.status === 'confirmed') {
        setTransaction((prev) => ({ ...prev, status: 'confirmed' }))
        toast.success('Transaction confirmed on-chain', { id: txHash })
      } else if (finalState.status === 'failed') {
        setTransaction((prev) => ({ ...prev, status: 'failed', error: 'Transaction reverted' }))
        toast.error('Transaction failed. You can retry.', { id: txHash })
      } else {
        toast('Transaction is still pending on the network.', { id: txHash, icon: '⏳' })
      }
    } else {
      setTransaction((prev) => ({ ...prev, status: 'confirmed', txHash: 'off-chain-only' }))
    }

    return response
  }

  const markTransactionFailed = (message) => {
    setTransaction((prev) => ({
      ...(prev || {}),
      status: 'failed',
      error: message || 'Transaction failed',
    }))
  }

  return {
    transaction,
    setTransaction,
    executeTransaction,
    markTransactionFailed,
  }
}
