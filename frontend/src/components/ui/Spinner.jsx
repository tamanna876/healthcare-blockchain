export default function Spinner({ size = 24 }) {
  return (
    <div className="flex items-center justify-center">
      <svg
        className="animate-spin"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="rgba(15, 23, 42, 0.15)"
          strokeWidth="4"
        />
        <path
          d="M22 12c0-5.522-4.478-10-10-10"
          stroke="rgba(26, 154, 255, 0.9)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
