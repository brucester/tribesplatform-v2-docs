// Main app shell - Regenerative Neighborhood Wizard
const { useState: useAppState, useEffect: useAppEffect, useMemo: useAppMemo } = React;

const STORAGE_KEY = 'rnf_wizard_v1';

function ThemeToggle({ theme, setTheme }) {
  return (
    <div className="theme-toggle" title="Toggle theme">
      <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')} aria-label="Light">☀</button>
      <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')} aria-label="Dark">☾</button>
    </div>
  );
}

function App() {
  const D = window.FW_DATA;

  const [theme, setTheme] = useAppState(() => {
    try {
      const t = localStorage.getItem(STORAGE_KEY + '_theme');
      if (t) return t;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch { return 'light'; }
  });
  useAppEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY + '_theme', theme); } catch {}
  }, [theme]);

  // Flatten steps in order with phase reference
  const flat = useAppMemo(() => {
    const arr = [{ id: 'welcome', kind: 'welcome' }];
    D.phases.forEach(p => p.steps.forEach(s => arr.push({ ...s, phaseRef: p })));
    arr.push({ id: 'dashboard', kind: 'dashboard' });
    return arr;
  }, []);

  // Load saved state
  const [values, setValues] = useAppState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  const [currentId, setCurrentId] = useAppState(() => {
    try {
      const id = localStorage.getItem(STORAGE_KEY + '_pos');
      return id || 'welcome';
    } catch { return 'welcome'; }
  });

  const [showDoc, setShowDoc] = useAppState(false);
  const [showImport, setShowImport] = useAppState(false);

  // Persist
  useAppEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch {}
  }, [values]);
  useAppEffect(() => {
    try { localStorage.setItem(STORAGE_KEY + '_pos', currentId); } catch {}
  }, [currentId]);

  const idx = flat.findIndex(s => s.id === currentId);
  const current = flat[idx] || flat[0];

  const handleField = (id, val) => setValues(v => ({ ...v, [id]: val }));
  const handleSlider = (id, val) => setValues(v => ({ ...v, [id]: val }));
  const handleCheck = (id, val) => setValues(v => ({ ...v, [id]: val }));

  const goNext = () => {
    if (idx < flat.length - 1) {
      setCurrentId(flat[idx + 1].id);
      scrollMainToTop();
    }
  };
  const goPrev = () => {
    if (idx > 0) {
      setCurrentId(flat[idx - 1].id);
      scrollMainToTop();
    }
  };
  const jumpTo = (id) => {
    setCurrentId(id);
    scrollMainToTop();
  };

  // Scroll sidebar to keep active step visible
  useAppEffect(() => {
    const sidebar = document.querySelector('.sidebar');
    const el = document.querySelector(`[data-step-id="${currentId}"]`);
    if (sidebar && el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentId]);

  function scrollMainToTop() {
    // window scroll
    try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch {}
    // main column (desktop has its own scroll context inside .main sometimes)
    setTimeout(() => {
      const mainEl = document.querySelector('.main');
      if (mainEl) mainEl.scrollTop = 0;
      try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch {}
    }, 0);
  }

  // Per-section import: opens import modal scoped to a particular step section
  const [importScope, setImportScope] = useAppState(null); // { step, section } | null
  const handleSectionImport = (step, section) => {
    setImportScope({ step, section });
    setShowImport(true);
  };

  const hasProgress = Object.keys(values).length > 0;
  const pillarScores = computePillarScores(values);

  // Determine current spiral for rail
  const currentPhase = current.phaseRef ||
    (current.kind === 'welcome' ? D.phases[0] :
     current.kind === 'dashboard' ? D.phases[D.phases.length - 1] : D.phases[0]);
  const currentSpiral = currentPhase.spiral;
  const completedSpirals = D.phases.filter(p => p.spiral < currentSpiral).map(p => p.spiral);

  const handlePrint = () => {
    setShowDoc(false);
    setTimeout(() => {
      // Render printable content fullscreen
      const printDiv = document.createElement('div');
      printDiv.id = '__print_root';
      printDiv.style.cssText = 'position:fixed;inset:0;background:white;z-index:9999;overflow:auto;padding:32px 48px;';
      document.body.appendChild(printDiv);
      const root = ReactDOM.createRoot(printDiv);
      root.render(
        <DocBody values={values} D={D}
          pillarScores={computePillarScores(values)}
          overall={Object.values(computePillarScores(values)).reduce((a,b)=>a+b,0)/5}
          today={new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          projectName={values.project_name || 'Untitled Regenerative Neighborhood'}/>
      );
      setTimeout(() => {
        document.body.classList.add('printing');
        window.print();
        setTimeout(() => {
          document.body.classList.remove('printing');
          root.unmount();
          printDiv.remove();
        }, 500);
      }, 300);
    }, 100);
  };

  const [mobileTab, setMobileTab] = useAppState('content'); // 'nav' | 'content' | 'stats'
  const TABS = ['nav', 'content', 'stats'];
  const swipeRef = React.useRef({ x: 0, y: 0, t: 0, active: false });

  const onTouchStart = (e) => {
    const t = e.touches[0];
    // Don't intercept swipes that begin on a slider or scrollable element
    const el = e.target;
    if (el.closest && (el.closest('input[type="range"]') || el.closest('.slider') || el.closest('.guide-pop') || el.closest('.modal'))) {
      swipeRef.current.active = false;
      return;
    }
    swipeRef.current = { x: t.clientX, y: t.clientY, t: Date.now(), active: true };
  };
  const onTouchEnd = (e) => {
    if (!swipeRef.current.active) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeRef.current.x;
    const dy = t.clientY - swipeRef.current.y;
    const dt = Date.now() - swipeRef.current.t;
    swipeRef.current.active = false;
    // require horizontal-dominant, fast-enough swipe of >= 60px
    if (Math.abs(dx) < 60) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.4) return; // not horizontal enough
    if (dt > 700) return;
    const i = TABS.indexOf(mobileTab);
    if (dx < 0 && i < TABS.length - 1) setMobileTab(TABS[i + 1]); // swipe left → next
    if (dx > 0 && i > 0) setMobileTab(TABS[i - 1]); // swipe right → prev
  };

  return (
    <div className="app" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Mobile tab bar */}
      <nav className="mobile-tabs no-print">
        <button className={`mobile-tab ${mobileTab === 'nav' ? 'active' : ''}`} onClick={() => setMobileTab('nav')}>
          <span className="mobile-tab-icon">☰</span>
          <span>Steps</span>
        </button>
        <button className={`mobile-tab ${mobileTab === 'content' ? 'active' : ''}`} onClick={() => setMobileTab('content')}>
          <span className="mobile-tab-icon">✏</span>
          <span>Content</span>
        </button>
        <button className={`mobile-tab ${mobileTab === 'stats' ? 'active' : ''}`} onClick={() => setMobileTab('stats')}>
          <span className="mobile-tab-icon">◎</span>
          <span>Radar</span>
        </button>
        <div className="mobile-tab-indicator" data-tab={mobileTab}></div>
      </nav>

      {/* Sidebar */}
      <aside className={`sidebar no-print${mobileTab === 'nav' ? ' mobile-open' : ''}`}>
        <div className="brand">
          <img src="regen-logo.png" alt="Regen Tribe" className="brand-logo"/>
          <div style={{flex: 1, minWidth: 0}}>
            <div className="brand-name">Regen Neighborhood</div>
            <div className="brand-sub">Framework v2</div>
          </div>
          <ThemeToggle theme={theme} setTheme={setTheme}/>
        </div>

        <ul className="phase-list">
          <li className={`step ${currentId === 'welcome' ? 'active' : ''}`}
              data-step-id="welcome"
              style={{paddingLeft: 0, marginBottom: 12}}
              onClick={() => jumpTo('welcome')}>
            <div className="step-dot" style={{borderColor: currentId === 'welcome' ? 'var(--rnf)' : 'var(--rule)'}}></div>
            <div>Welcome</div>
          </li>

          {D.phases.map(phase => (
            <li key={phase.id} className={`phase${phase.steps.some(s => s.id === currentId) ? ' has-active' : ''}`}>
              <div className="phase-header">
                <span className="phase-num">{phase.num}</span>
                <span className="phase-title">{phase.name}</span>
                <span className="phase-time">{phase.time.split(' ').slice(-1)[0]}</span>
              </div>
              <ul className="step-list">
                {phase.steps.map(s => {
                  const isActive = s.id === currentId;
                  const isComplete = stepComplete(s, values);
                  const isGate = s.kind === 'gate';
                  const gateState = isGate ? gateStatus(s, values) : null;
                  let cls = 'step';
                  if (isActive) cls += ' active';
                  if (isComplete) cls += ' complete';
                  if (isGate) {
                    cls += ' gate';
                    if (gateState === 'ready') cls += ' passed';
                    else if (gateState === 'warning') cls += ' gate-warning';
                  }
                  return (
                    <li key={s.id} className={cls} data-step-id={s.id} onClick={() => jumpTo(s.id)}>
                      <div className="step-dot"></div>
                      <div>{isGate ? `Gate ${s.gateNum === 34 ? '3·4' : s.gateNum}` : `${s.num} ${s.title}`}</div>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}

          <li className={`step ${currentId === 'dashboard' ? 'active' : ''}`}
              data-step-id="dashboard"
              style={{paddingLeft: 0, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--rule-soft)'}}
              onClick={() => jumpTo('dashboard')}>
            <div className="step-dot"></div>
            <div>📊 Dashboard</div>
          </li>
        </ul>

        <div className="legend">
          <div className="legend-title">Frameworks</div>
          {Object.entries(D.frameworks).map(([k, fw]) => (
            <div key={k} className="legend-item">
              <div className="legend-swatch" style={{background: fw.color}}></div>
              <div>
                <div className="legend-name">{fw.name}</div>
                <div style={{fontSize: 10.5, color: 'var(--ink-3)'}}>{fw.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className={`main${mobileTab !== 'content' ? ' mobile-hidden' : ''}`}
        id="mobile-main">
        {current.kind === 'welcome' && (
          <WelcomeView
            onStart={() => jumpTo(D.phases[0].steps[0].id)}
            hasProgress={hasProgress}
            onJumpToDashboard={() => jumpTo('dashboard')}
            onImport={() => setShowImport(true)}
          />
        )}
        {current.kind === 'dashboard' && (
          <DashboardView values={values} onJump={jumpTo} onPrint={() => setShowDoc(true)}/>
        )}
        {current.phaseRef && (
          <StepView
            step={current}
            phase={current.phaseRef}
            values={values}
            allValues={values}
            onField={handleField}
            onSlider={handleSlider}
            onCheck={handleCheck}
            onNext={goNext}
            onPrev={goPrev}
            onJump={jumpTo}
            onImport={handleSectionImport}
          />
        )}
      </main>

      {/* Right rail — also shown as mobile stats tab */}
      <aside className={`rail no-print${mobileTab === 'stats' ? ' mobile-open' : ''}`}
        id="mobile-rail">
        <div className="rail-section">
          <div className="rail-title">Live Diagnostic</div>
          <PillarRadar scores={pillarScores} size={260}/>
        </div>

        <div className="rail-section">
          <div className="rail-title">RNF Pillars</div>
          <PillarBars scores={pillarScores} onJump={jumpTo}/>
        </div>

        <div className="rail-section">
          <div className="rail-title">5-Spiral Timeline</div>
          <SpiralMini currentSpiral={currentSpiral} completedSpirals={completedSpirals}/>
          <div style={{fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-3)', letterSpacing: '0.1em', marginTop: 6}}>
            CURRENT: SPIRAL {currentSpiral}
          </div>
        </div>

        <div className="rail-section">
          <button className="btn" style={{width:'100%', justifyContent:'center'}} onClick={() => setShowImport(true)}>
            ✨ Import from document
          </button>
          <button className="btn" style={{width:'100%', justifyContent:'center', marginTop: 8}} onClick={() => setShowDoc(true)}>
            📄 Project document
          </button>
          <button className="btn btn-ghost" style={{width:'100%', justifyContent:'center', marginTop: 8, fontSize: 11}}
            onClick={() => {
              if (confirm('Reset all wizard data? This cannot be undone.')) {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(STORAGE_KEY + '_pos');
                setValues({}); setCurrentId('welcome');
              }
            }}>
            Reset progress
          </button>
        </div>
      </aside>

      {showDoc && (
        <ProjectDocumentView values={values} onClose={() => setShowDoc(false)} onPrint={handlePrint}/>
      )}
      {showImport && (
        <ImportModal
          onClose={() => { setShowImport(false); setImportScope(null); }}
          currentValues={values}
          scope={importScope}
          onApply={(extracted) => setValues(v => ({ ...v, ...extracted }))}
        />
      )}
    </div>
  );
}

function stepComplete(step, values) {
  if (step.kind === 'gate') return false;
  const fields = (step.fields||[]);
  const sliders = (step.sliders||[]);
  const checks = (step.checklist||[]);
  if (fields.length === 0 && sliders.length === 0 && checks.length === 0) return false;
  let hasAny = false;
  fields.forEach(f => { if (values[f.id] && String(values[f.id]).length > 5) hasAny = true; });
  sliders.forEach(s => { if (values[s.id] != null) hasAny = true; });
  checks.forEach(c => { if (values[c.id]) hasAny = true; });
  return hasAny;
}

function gateStatus(step, values) {
  const met = step.criteria.filter(c => {
    const v = values[c.metric];
    return (typeof v === 'boolean' && v) || (typeof v === 'number' && v >= 6);
  }).length;
  const ratio = met / step.criteria.length;
  if (ratio >= 0.8) return 'ready';
  if (ratio >= 0.5) return 'warning';
  return 'not-ready';
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
