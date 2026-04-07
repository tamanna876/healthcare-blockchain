export default function TransactionStatusCard({ transaction, onRetry }) {
  if (!transaction?.txHash) {
    return null
  }

  const statusClass =
    transaction.status === 'confirmed'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : transaction.status === 'failed'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-amber-200 bg-amber-50 text-amber-800'

  return (
    <div className={`rounded-xl border p-4 text-sm ${statusClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">Transaction status: {transaction.status || 'pending'}</p>
        {transaction.status === 'failed' ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-rose-300 bg-white px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
          >
            Retry
          </button>
        ) : null}
      </div>
      <p className="mt-2 break-all text-xs">Hash: {transaction.txHash}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <p className="text-xs">Network: {transaction.networkName || 'unknown'}</p>
        <p className="text-xs">Est. gas: {transaction.estimatedGas || 'n/a'}</p>
      </div>
      {transaction.error ? <p className="mt-2 text-xs">Reason: {transaction.error}</p> : null}
    </div>
  )
}
