const DOT_DELAYS = ["0ms", "130ms", "260ms"]

function TypingIndicator({ className = "" }) {
  return (
    <div
      className={`typing-indicator ${className}`}
      role="status"
      aria-label="Assistant is generating a response"
    >
      <span className="sr-only">Assistant is generating a response</span>
      {DOT_DELAYS.map((delay) => (
        <span
          key={delay}
          className="typing-indicator__dot"
          style={{ "--typing-dot-delay": delay }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export default TypingIndicator
