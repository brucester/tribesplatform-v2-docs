// Shared components for the wizard
const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ---------- Brand mark ----------
function BrandMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--ink)"/>
      <circle cx="16" cy="16" r="9" stroke="var(--bg)" strokeWidth="1.25" fill="none" opacity="0.4"/>
      <circle cx="16" cy="16" r="5" stroke="var(--bg)" strokeWidth="1.25" fill="none" opacity="0.7"/>
      <circle cx="16" cy="16" r="2" fill="var(--accent)"/>
    </svg>
  );
}

// ---------- Crumb ----------
function Crumb({ items }) {
  return (
    <div className="crumb">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="crumb-sep">/</span>}
          <span>{it}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

// ---------- Framework tags ----------
function FrameworkTags({ items }) {
  return (
    <div className="framework-tags">
      {items.map((line, i) => {
        const fw = line.split(':')[0].trim().toLowerCase();
        return <span key={i} className={`fw-tag ${fw}`}>{line}</span>;
      })}
    </div>
  );
}

// ---------- Guide popover ----------
// Renders a small "?" button. Clicking it opens a popover with substantive
// guidance sourced from the Community Alchemy Playbook.
function GuideButton({ guide }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  if (!guide) return null;
  return (
    <span className="guide-wrap" ref={ref}>
      <button
        type="button"
        className={`guide-btn ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="How to answer this"
        aria-expanded={open}
        title="How to answer this"
      >
        <span className="guide-icon">?</span>
        <span className="guide-label">Guide</span>
      </button>
      {open && (
        <div className="guide-pop" role="dialog">
          <div className="guide-pop-head">
            <div className="guide-pop-title">{guide.title}</div>
            {guide.source && <div className="guide-pop-source">{guide.source}</div>}
          </div>
          <div className="guide-pop-body">
            {(guide.body || []).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <button className="guide-pop-close" onClick={() => setOpen(false)}>Close</button>
        </div>
      )}
    </span>
  );
}

// ---------- Slider ----------
function ScoreSlider({ id, label, frame, value, onChange, guide }) {
  const v = value ?? 5;
  return (
    <div className="slider-row">
      <div className="slider-meta">
        <div className="slider-q">
          <span>{label}</span>
          {guide && <GuideButton guide={guide}/>}
        </div>
        <div className="slider-track-wrap">
          <input
            type="range"
            className="slider"
            min="0" max="10" step="1"
            value={v}
            onChange={e => onChange(id, parseInt(e.target.value, 10))}
          />
          <div className="slider-scale">
            <span>Not yet</span>
            <span>{frame}</span>
            <span>Solid</span>
          </div>
        </div>
      </div>
      <div className="slider-value">{v}</div>
    </div>
  );
}

// ---------- Field status tri-button ----------
// status values: 'pending' (no answer yet), 'help' (needs help), 'ready'
function FieldStatus({ id, value, onChange, guide }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!helpOpen) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setHelpOpen(false); };
    const onEsc = (e) => { if (e.key === 'Escape') setHelpOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [helpOpen]);

  const v = value || '';

  const helpContent = guide || {
    title: 'Need help with this question?',
    body: [
      "Take a moment. There's no perfect answer — write what feels true right now and revise later.",
      "Try writing one short sentence first. Then expand. Or skip it and come back after a related step."
    ]
  };

  return (
    <div className="field-status" ref={ref}>
      <button
        type="button"
        className={`fs-btn fs-pending ${v === 'pending' ? 'on' : ''}`}
        onClick={() => onChange(id, v === 'pending' ? '' : 'pending')}
        title="No answer yet"
      >
        <span className="fs-dot"></span>
        No answer yet
      </button>
      <button
        type="button"
        className={`fs-btn fs-help ${v === 'help' ? 'on' : ''} ${helpOpen ? 'open' : ''}`}
        onClick={() => { onChange(id, v === 'help' ? '' : 'help'); setHelpOpen(o => !o); }}
        title="Almost there"
      >
        <span className="fs-dot"></span>
        Almost there
      </button>
      <button
        type="button"
        className={`fs-btn fs-ready ${v === 'ready' ? 'on' : ''}`}
        onClick={() => onChange(id, v === 'ready' ? '' : 'ready')}
        title="Ready to go"
      >
        <span className="fs-dot"></span>
        Ready to go
      </button>
      {helpOpen && (
        <div className="fs-help-pop" role="dialog">
          <div className="fs-help-title">{helpContent.title}</div>
          <div className="fs-help-body">
            {(helpContent.body || []).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <button className="fs-help-close" onClick={() => setHelpOpen(false)}>Close</button>
        </div>
      )}
    </div>
  );
}

// ---------- Text field ----------
function TextField({ field, value, onChange, statusValue }) {
  const statusId = field.id + '_status';
  return (
    <div className="field">
      <div className="field-label-row">
        <label className="field-label">{field.label}</label>
        {field.guide && <GuideButton guide={field.guide}/>}
      </div>
      {field.help && <div className="field-help">{field.help}</div>}
      {field.kind === 'textarea' ? (
        <textarea
          className="textarea"
          rows={field.rows || 4}
          value={value || ''}
          onChange={e => onChange(field.id, e.target.value)}
          placeholder=""
        />
      ) : (
        <input
          type="text"
          className="input"
          value={value || ''}
          onChange={e => onChange(field.id, e.target.value)}
        />
      )}
      <FieldStatus
        id={statusId}
        value={statusValue}
        onChange={onChange}
        guide={field.guide}
      />
    </div>
  );
}

// ---------- Checklist ----------
function Checklist({ items, values, onChange, onField }) {
  return (
    <ul className="checklist">
      {items.map(it => {
        const checked = !!values[it.id];
        const noteId = it.id + '_note';
        const noteVal = values[noteId] || '';
        return (
          <li
            key={it.id}
            className={`check-item ${checked ? 'checked' : ''}`}
          >
            <div className="check-item-head">
              <div className="check-row" onClick={() => onChange(it.id, !checked)}>
                <div className="check-box"></div>
                <div className="check-text">{it.text}</div>
              </div>
              {it.guide && <GuideButton guide={it.guide}/>}
            </div>
            <textarea
              className="check-note"
              rows={2}
              value={noteVal}
              placeholder="Notes, evidence, or how this is handled…"
              onChange={e => onField && onField(noteId, e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </li>
        );
      })}
    </ul>
  );
}

// ---------- Pillar bars (right rail + dashboard) ----------
function PillarBars({ scores, onJump }) {
  const pillars = window.FW_DATA.pillars;
  const [hoveredId, setHoveredId] = useState(null);
  const tipRef = useRef(null);

  useEffect(() => {
    if (!hoveredId) return;
    const onDoc = (e) => {
      if (tipRef.current && !tipRef.current.contains(e.target)) setHoveredId(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [hoveredId]);

  return (
    <div>
      {pillars.map(p => {
        const v = scores[p.id] ?? 0;
        const isPerfect = v >= 9.5;
        const isHovered = hoveredId === p.id;
        const steps = (window.PILLAR_STEPS || {})[p.id] || [];
        return (
          <div key={p.id} className="pillar-bar" style={{position:'relative'}}>
            <div className="pillar-bar-head">
              <span className="pillar-bar-name">{p.name}</span>
              <span
                className="pillar-bar-val"
                style={{
                  cursor: !isPerfect && onJump ? 'pointer' : 'default',
                  color: !isPerfect && onJump ? p.color : undefined,
                  textDecoration: !isPerfect && onJump ? 'underline dotted' : undefined
                }}
                onMouseEnter={() => !isPerfect && onJump && setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {v.toFixed(1)}/10
              </span>
            </div>
            <div className="pillar-bar-track"
              style={{cursor: !isPerfect && onJump ? 'pointer' : 'default'}}
              onMouseEnter={() => !isPerfect && onJump && setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="pillar-bar-fill" style={{ width: `${v * 10}%`, background: p.color }}></div>
            </div>

            {isHovered && onJump && steps.length > 0 && (
              <div
                ref={tipRef}
                className="pillar-tip"
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="pillar-tip-head">Improve {p.name}</div>
                {steps.map(s => (
                  <button key={s.id} className="pillar-tip-step" onClick={() => { onJump(s.id); setHoveredId(null); }}>
                    <span className="pillar-tip-title">{s.title}</span>
                    <span className="pillar-tip-note">{s.note}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------- Spiral mini timeline ----------
function SpiralMini({ currentSpiral, completedSpirals }) {
  return (
    <div className="spiral-track">
      {[1,2,3,4,5].map(n => {
        const cls = n === currentSpiral ? 'active' :
                    completedSpirals.includes(n) ? 'passed' : '';
        return <div key={n} className={`spiral-cell ${cls}`}>S{n}</div>;
      })}
    </div>
  );
}

// ---------- Pillar radar ----------
function PillarRadar({ scores, size = 280 }) {
  const pillars = window.FW_DATA.pillars;
  const cx = size / 2, cy = size / 2;
  const rMax = size / 2 - 44;
  const n = pillars.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i, val) => {
    const r = (val / 10) * rMax;
    return [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
  };
  const ringPoints = (val) =>
    pillars.map((_, i) => point(i, val).join(',')).join(' ');
  const dataPoints = pillars.map((p, i) =>
    point(i, scores[p.id] ?? 0).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%">
      {[2.5, 5, 7.5, 10].map(v => (
        <polygon key={v} points={ringPoints(v)} fill="none" stroke="var(--rule)" strokeWidth="1" strokeDasharray={v === 10 ? '' : '2 3'}/>
      ))}
      {pillars.map((p, i) => {
        const [x, y] = point(i, 10);
        return <line key={p.id} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--rule)" strokeWidth="1"/>;
      })}
      <polygon points={dataPoints} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.5"/>
      {pillars.map((p, i) => {
        const [x, y] = point(i, scores[p.id] ?? 0);
        return <circle key={p.id} cx={x} cy={y} r="3" fill={p.color}/>;
      })}
      {pillars.map((p, i) => {
        const a = angle(i);
        const lx = cx + Math.cos(a) * (rMax + 22);
        const ly = cy + Math.sin(a) * (rMax + 18);
        const cosA = Math.cos(a);
        const anchor = Math.abs(cosA) < 0.2 ? 'middle' : (cosA > 0 ? 'end' : 'start');
        const adjustedLx = anchor === 'middle' ? lx : (anchor === 'end' ? Math.min(lx, size - 4) : Math.max(lx, 4));
        return (
          <text key={p.id} x={adjustedLx} y={ly} fontSize="10" fontFamily="var(--mono)"
                fill="var(--ink-3)" textAnchor={anchor} dominantBaseline="middle"
                fontWeight="500">
            {p.name.toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}

// expose to window
Object.assign(window, {
  BrandMark, Crumb, FrameworkTags, ScoreSlider, TextField,
  Checklist, PillarBars, SpiralMini, PillarRadar, GuideButton
});
