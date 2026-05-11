// AI document scanner - extracts wizard field answers from uploaded documents

function buildFieldCatalog(scope) {
  // Build a flat catalog of all fields/sliders/checks the AI can fill
  // If scope = { step, section } is provided, only catalog matching items.
  const D = window.FW_DATA;
  const catalog = [];
  const scopedStepId = scope && scope.step ? scope.step.id : null;
  const scopedSection = scope && scope.section ? scope.section : null;

  D.phases.forEach(phase => {
    phase.steps.forEach(step => {
      if (step.kind === 'gate') return;
      if (scopedStepId && step.id !== scopedStepId) return;

      if (!scopedSection || scopedSection === 'fields') {
        (step.fields || []).forEach(f => {
          catalog.push({
            id: f.id, kind: 'text',
            phase: phase.name, step: step.title,
            label: f.label, help: f.help || ''
          });
        });
      }
      if (!scopedSection || scopedSection === 'sliders') {
        (step.sliders || []).forEach(s => {
          catalog.push({
            id: s.id, kind: 'slider',
            phase: phase.name, step: step.title,
            label: s.label, help: 'Score 0-10'
          });
        });
      }
      if (!scopedSection || scopedSection === 'checklist') {
        (step.checklist || []).forEach(c => {
          catalog.push({
            id: c.id, kind: 'check',
            phase: phase.name, step: step.title,
            label: c.text, help: 'Yes/No'
          });
          // Also expose the note text field that pairs with each checklist item
          catalog.push({
            id: c.id + '_note', kind: 'text',
            phase: phase.name, step: step.title,
            label: 'Notes for: ' + c.text,
            help: 'Short note describing how this is handled, evidence, or who is responsible.'
          });
        });
      }
    });
  });
  return catalog;
}

async function readFileAsText(file) {
  if (file.type === 'application/pdf') {
    return `[PDF file: ${file.name}] — Note: PDF parsing not available in browser. Please paste text content or use .txt/.md/.docx files.`;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function scanDocument(documentText, projectName, scope) {
  const catalog = buildFieldCatalog(scope);

  // Group catalog by step for prompt clarity
  const fieldsByStep = {};
  catalog.forEach(f => {
    const key = `${f.phase} — ${f.step}`;
    if (!fieldsByStep[key]) fieldsByStep[key] = [];
    fieldsByStep[key].push(f);
  });

  const fieldList = Object.entries(fieldsByStep).map(([step, fields]) => {
    return `### ${step}\n` + fields.map(f =>
      `- ${f.id} (${f.kind}): "${f.label}"${f.help ? ' — ' + f.help : ''}`
    ).join('\n');
  }).join('\n\n');

  const scopeHint = scope && scope.step
    ? `\n\nIMPORTANT: Focus only on the "${scope.step.title}" step${scope.section ? ' (' + scope.section + ' section)' : ''}. Only return fields listed below.`
    : '';

  const prompt = `You are helping pre-fill a Regenerative Neighborhood Framework wizard from an existing project document.

Below is the user's document, followed by the catalog of wizard fields. Extract any information from the document that maps to these fields. Return a JSON object with field IDs as keys.

Rules:
- For text fields: return a string with extracted/synthesized content (1-3 sentences). If nothing relevant, omit the key.
- For slider fields: return an integer 0-10 reflecting confidence/maturity in that area based on document evidence. If unclear, omit.
- For check fields (id without "_note" suffix): return true only if the document clearly indicates this is in place. Otherwise omit.
- For checklist note fields (id ending in "_note"): if the corresponding checklist item is true OR the doc has relevant info, write a 1-2 sentence note describing how it's handled, evidence, or who's responsible. Be concrete.
- Only include fields where you have actual evidence from the document. Omit anything you'd be guessing.
- Also include a "project_name" key with a short name if you can infer one (only if not scoped).
- Also include a "_summary" key with a 2-sentence summary of what the document is about.
- Also include "_extracted_count" with the number of fields you populated.${scopeHint}

DOCUMENT:
"""
${documentText.slice(0, 12000)}
"""

WIZARD FIELDS:
${fieldList}

Return ONLY valid JSON, no markdown fences, no commentary.`;

  const resp = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${resp.status})`);
  }
  const { result } = await resp.json();

  // Parse JSON
  let parsed;
  try {
    // strip code fences if any
    let cleaned = result.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(json)?\s*/, '').replace(/```\s*$/, '');
    }
    // find first { and last }
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) cleaned = cleaned.slice(start, end + 1);
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('AI returned non-JSON: ' + result.slice(0, 200));
  }
  return parsed;
}

// ---------- UI ----------
function ImportModal({ onClose, onApply, currentValues, scope }) {
  const [stage, setStage] = React.useState('upload'); // upload | scanning | review | error
  const [docText, setDocText] = React.useState('');
  const [fileName, setFileName] = React.useState('');
  const [extracted, setExtracted] = React.useState(null);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [acceptedKeys, setAcceptedKeys] = React.useState({});

  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    try {
      const text = await readFileAsText(file);
      setDocText(text);
    } catch (e) {
      setErrorMsg('Could not read file: ' + e.message);
      setStage('error');
    }
  };

  const handleScan = async () => {
    if (!docText.trim()) {
      setErrorMsg('Paste some text or upload a file first.');
      return;
    }
    setStage('scanning');
    setErrorMsg('');
    try {
      const result = await scanDocument(docText, null, scope);
      setExtracted(result);
      // pre-accept all by default
      const accepted = {};
      Object.keys(result).forEach(k => { if (!k.startsWith('_')) accepted[k] = true; });
      setAcceptedKeys(accepted);
      setStage('review');
    } catch (e) {
      setErrorMsg(e.message || 'Scan failed.');
      setStage('error');
    }
  };

  const handleApply = () => {
    const toApply = {};
    Object.entries(extracted).forEach(([k, v]) => {
      if (k.startsWith('_')) return;
      if (acceptedKeys[k]) toApply[k] = v;
    });
    onApply(toApply);
    onClose();
  };

  const catalog = buildFieldCatalog(scope);
  const fieldMeta = (id) => catalog.find(f => f.id === id) || { label: id, kind: 'text', step: '' };

  return (
    <div className="modal-bg no-print" onClick={onClose}>
      <div className="modal" style={{position:'relative', maxWidth: 760}} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div style={{marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--rule)'}}>
          <div className="eyebrow">AI-Assisted Import {scope && scope.step ? '· Scoped' : ''}</div>
          <div style={{fontFamily:'var(--serif)', fontSize:28, marginTop: 6}}>
            {scope && scope.step ? `Fill the "${scope.step.title}" ${scope.section || 'step'}` : 'Scan an existing document'}
          </div>
          <div style={{fontSize:13.5, color:'var(--ink-2)', marginTop: 8, fontFamily:'var(--serif)', fontStyle:'italic'}}>
            {scope && scope.step
              ? 'Upload a document and we\'ll pre-fill just this section.'
              : 'Have a vision deck, charter, or feasibility study? Drop it in and we\'ll pre-fill what we can.'}
          </div>
        </div>

        {stage === 'upload' && (
          <div>
            <FileDropzone onFile={handleFile} fileName={fileName}/>

            <div style={{marginTop: 20}}>
              <div className="field-label" style={{marginBottom: 6}}>Or paste document text</div>
              <textarea
                className="textarea"
                rows={8}
                placeholder="Paste your project charter, vision document, business plan, meeting notes…"
                value={docText}
                onChange={e => setDocText(e.target.value)}
              />
              {docText && (
                <div className="mono" style={{fontSize: 10, color: 'var(--ink-3)', marginTop: 4, letterSpacing: '0.08em'}}>
                  {docText.length.toLocaleString()} CHARS · {docText.length > 12000 ? 'will truncate first 12k for scan' : 'full document will be scanned'}
                </div>
              )}
            </div>

            <div className="card-warm card" style={{marginTop: 18, fontSize: 12.5, lineHeight: 1.5}}>
              <strong style={{fontFamily: 'var(--serif)', fontSize: 14}}>How it works.</strong> Claude reads your document and proposes answers for fields it finds evidence for. You review and accept what's good; nothing is applied without your sign-off. Best for plain-text formats (.txt, .md). PDFs need text pasted manually.
            </div>

            <div className="nav-row">
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleScan} disabled={!docText.trim()}>
                Scan with AI →
              </button>
            </div>
          </div>
        )}

        {stage === 'scanning' && (
          <div style={{padding: '40px 0', textAlign: 'center'}}>
            <div className="scan-spinner"></div>
            <div style={{fontFamily:'var(--serif)', fontSize: 22, marginTop: 20}}>Reading your document…</div>
            <div style={{fontSize: 13, color:'var(--ink-3)', marginTop: 8, fontStyle:'italic'}}>
              Mapping content to RNF · Alchemy · RCOS · CLIPS fields
            </div>
            <div style={{display: 'flex', justifyContent: 'center', gap: 6, marginTop: 24}}>
              {['rnf','alchemy','rcos','clips'].map((k, i) => (
                <div key={k} className="scan-dot" style={{
                  background: window.FW_DATA.frameworks[k].color,
                  animationDelay: `${i * 150}ms`
                }}/>
              ))}
            </div>
          </div>
        )}

        {stage === 'review' && extracted && (
          <div>
            <div className="card" style={{background: 'var(--paper-2)', marginBottom: 20}}>
              <div className="eyebrow" style={{marginBottom: 6}}>Document summary</div>
              <div style={{fontFamily:'var(--serif)', fontSize: 16, fontStyle:'italic', color:'var(--ink-2)'}}>
                {extracted._summary || 'No summary available.'}
              </div>
              <div style={{fontFamily:'var(--mono)', fontSize: 11, color:'var(--ink-3)', marginTop: 12, letterSpacing: '0.1em'}}>
                {Object.keys(extracted).filter(k => !k.startsWith('_')).length} FIELDS POPULATED · REVIEW BELOW
              </div>
            </div>

            <div className="section-head">
              <div className="section-title">Proposed answers</div>
              <div className="section-meta">
                {Object.values(acceptedKeys).filter(Boolean).length} accepted
              </div>
            </div>

            <div style={{maxHeight: 360, overflowY: 'auto', marginBottom: 20, paddingRight: 4}}>
              {Object.entries(extracted).filter(([k]) => !k.startsWith('_') && k !== 'project_name').map(([key, val]) => {
                const meta = fieldMeta(key);
                const accepted = acceptedKeys[key];
                const conflict = currentValues[key] != null && currentValues[key] !== '';
                return (
                  <div key={key} style={{
                    padding: 12,
                    marginBottom: 8,
                    background: accepted ? 'var(--paper)' : 'var(--paper-2)',
                    border: '1px solid ' + (accepted ? 'var(--rnf)' : 'var(--rule-soft)'),
                    borderRadius: 4,
                    cursor: 'pointer',
                    opacity: accepted ? 1 : 0.6
                  }} onClick={() => setAcceptedKeys(a => ({...a, [key]: !a[key]}))}>
                    <div style={{display: 'flex', alignItems: 'flex-start', gap: 10}}>
                      <div className={`check-box ${accepted ? 'on' : ''}`} style={{
                        width: 16, height: 16, marginTop: 2,
                        background: accepted ? 'var(--rnf)' : 'var(--paper)',
                        border: '1.5px solid ' + (accepted ? 'var(--rnf)' : 'var(--rule)'),
                        borderRadius: 3, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {accepted && <span style={{color: 'var(--paper)', fontSize: 10, lineHeight: 1}}>✓</span>}
                      </div>
                      <div style={{flex: 1, minWidth: 0}}>
                        <div className="mono" style={{fontSize: 9.5, color:'var(--ink-3)', letterSpacing: '0.1em', marginBottom: 3}}>
                          {meta.step.toUpperCase()} {conflict && <span style={{color: 'var(--alchemy)', marginLeft: 8}}>· OVERWRITES EXISTING</span>}
                        </div>
                        <div style={{fontSize: 12.5, fontWeight: 600, marginBottom: 4}}>{meta.label}</div>
                        <div style={{fontSize: 13, color:'var(--ink-2)', lineHeight: 1.45}}>
                          {meta.kind === 'slider' ? (
                            <span><strong>{val}/10</strong></span>
                          ) : meta.kind === 'check' ? (
                            <span>{val ? '☑ Yes' : '☐ No'}</span>
                          ) : (
                            <span>{String(val)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="nav-row">
              <button className="btn btn-ghost" onClick={() => setStage('upload')}>← Back</button>
              <div className="row gap-8">
                <button className="btn" onClick={() => {
                  const all = {};
                  Object.keys(extracted).forEach(k => { if (!k.startsWith('_')) all[k] = !Object.values(acceptedKeys).every(Boolean); });
                  setAcceptedKeys(all);
                }}>Toggle all</button>
                <button className="btn btn-primary" onClick={handleApply}>
                  Apply {Object.values(acceptedKeys).filter(Boolean).length} answers →
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === 'error' && (
          <div>
            <div className="card card-warm" style={{padding: 24}}>
              <div style={{fontFamily:'var(--serif)', fontSize: 22, marginBottom: 8}}>Something went wrong</div>
              <div style={{fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55}}>{errorMsg}</div>
            </div>
            <div className="nav-row">
              <button className="btn btn-ghost" onClick={onClose}>Close</button>
              <button className="btn btn-primary" onClick={() => setStage('upload')}>Try again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FileDropzone({ onFile, fileName }) {
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef();

  return (
    <div
      className="dropzone"
      style={{
        border: '2px dashed ' + (dragOver ? 'var(--rnf)' : 'var(--rule)'),
        borderRadius: 4,
        padding: '28px 20px',
        textAlign: 'center',
        background: dragOver ? 'rgba(61,90,61,0.04)' : 'var(--paper-2)',
        cursor: 'pointer',
        transition: 'all 120ms'
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,.markdown,.json,text/*"
        style={{display:'none'}}
        onChange={e => onFile(e.target.files[0])}
      />
      <div style={{fontSize: 28, marginBottom: 8}}>📄</div>
      <div style={{fontFamily:'var(--serif)', fontSize: 18}}>
        {fileName ? <span>Loaded: <strong>{fileName}</strong></span> : 'Drop a document, or click to browse'}
      </div>
      <div style={{fontSize: 11, color:'var(--ink-3)', marginTop: 6, fontFamily: 'var(--mono)', letterSpacing: '0.1em'}}>
        .TXT · .MD · .JSON · plain text
      </div>
    </div>
  );
}

Object.assign(window, { ImportModal, scanDocument });
