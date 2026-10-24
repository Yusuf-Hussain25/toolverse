// Small form pieces shared by the tool pages

export const Field = ({ label, htmlFor, hint, children }) => (
  <div className="field">
    <label htmlFor={htmlFor}>{label}</label>
    {children}
    {hint && <p className="text-xs text-fg-3">{hint}</p>}
  </div>
)

// Single choice shown as chips (radio group semantics)
export const ChipChoice = ({ label, options, value, onChange, render = (o) => o }) => (
  <div className="field">
    <span className="text-[13px] font-medium text-fg-2" id={`${label}-label`}>{label}</span>
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-labelledby={`${label}-label`}>
      {options.map((o) => (
        <button
          type="button"
          key={o}
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={`chip !h-8 !px-3 transition-colors ${value === o ? 'chip-accent' : 'hover:border-line-strong hover:text-fg'}`}
        >
          {render(o)}
        </button>
      ))}
    </div>
  </div>
)

export const Suggestions = ({ items, onPick }) => (
  <div className="flex flex-wrap gap-1.5">
    {items.map((s) => (
      <button type="button" key={s} onClick={() => onPick(s)} className="rounded-full border border-dashed border-line-strong px-2.5 py-1 text-xs text-fg-3 transition-colors hover:border-accent hover:text-fg">
        {s}
      </button>
    ))}
  </div>
)

export const SubmitButton = ({ running, disabled, icon: Icon, children }) => (
  <button type="submit" className="btn btn-primary btn-block" disabled={running || disabled}>
    {running ? <span className="spinner !size-4" /> : <Icon size={17} />}
    {running ? 'Working…' : children}
  </button>
)
