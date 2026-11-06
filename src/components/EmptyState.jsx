const EmptyState = ({ title, message, action }) => (
  <div className="empty-state">
    <svg className="empty-mark" width="64" height="48" viewBox="0 0 64 48" aria-hidden="true">
      <path d="M6 38 22 20l14 8 22-20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
      <g fill="currentColor">
        <circle cx="6" cy="38" r="2.4" />
        <circle cx="22" cy="20" r="3" />
        <circle cx="36" cy="28" r="2.2" />
        <circle cx="58" cy="8" r="3.2" />
      </g>
    </svg>
    <h2>{title}</h2>
    <p>{message}</p>
    {action}
  </div>
)

export default EmptyState
