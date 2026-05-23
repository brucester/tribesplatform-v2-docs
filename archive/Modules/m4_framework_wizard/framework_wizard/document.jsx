// Project document export view (printable)
function ProjectDocumentView({ values, onClose, onPrint }) {
  const D = window.FW_DATA;
  const pillarScores = computePillarScores(values);
  const overall = Object.values(pillarScores).reduce((a,b) => a+b, 0) / 5;
  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const projectName = values.project_name || 'Untitled Regenerative Neighborhood';

  return (
    <div className="modal-bg no-print" onClick={onClose}>
      <div className="modal" style={{position:'relative'}} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--rule)'}}>
          <div>
            <div className="eyebrow">Preview & Export</div>
            <div style={{fontFamily:'var(--serif)', fontSize:24}}>Project Document</div>
          </div>
          <div className="row gap-8">
            <button className="btn" onClick={() => downloadAsMarkdown(values)}>⬇ Download Markdown</button>
            <button className="btn btn-primary" onClick={onPrint}>🖨 Print / Save PDF</button>
          </div>
        </div>

        <div id="printable-doc">
          <DocBody values={values} D={D} pillarScores={pillarScores} overall={overall} today={today} projectName={projectName}/>
        </div>
      </div>
    </div>
  );
}

function DocBody({ values, D, pillarScores, overall, today, projectName }) {
  return (
    <div style={{padding: '0 0 40px', fontFamily:'var(--sans)', color:'var(--ink)'}}>

      {/* Cover */}
      <div style={{textAlign:'left', padding:'40px 0 36px', borderBottom:'2px solid var(--ink)', marginBottom: 8}}>
        <div style={{display:'flex', alignItems:'center', gap: 16, marginBottom: 24}}>
          <img src="regen-logo.png" alt="Regen Tribe" style={{width:48, height:48, objectFit:'contain'}}/>
          <div className="eyebrow">Regenerative Neighborhood · Project Document</div>
        </div>
        <div style={{fontFamily:'var(--serif)', fontSize: 48, lineHeight: 1.05, letterSpacing:'-0.02em', marginBottom: 16}}>
          {projectName}
        </div>
        <div style={{fontFamily:'var(--serif)', fontSize: 18, fontStyle:'italic', color:'var(--ink-2)', marginBottom: 28, maxWidth: 560}}>
          {values.vision_statement || 'A regenerative neighborhood in formation.'}
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 16, paddingTop: 20, borderTop: '1px solid var(--rule-soft)', fontSize: 12}}>
          <div><div className="eyebrow" style={{marginBottom:4}}>Date</div><div>{today}</div></div>
          <div><div className="eyebrow" style={{marginBottom:4}}>Overall</div><div style={{fontWeight:600}}>{overall.toFixed(1)} / 10</div></div>
          <div><div className="eyebrow" style={{marginBottom:4}}>Frameworks</div><div>RNF · Alchemy · RCOS · CLIPS</div></div>
          <div><div className="eyebrow" style={{marginBottom:4}}>Version</div><div>v2.0</div></div>
        </div>
      </div>

      {/* Pillar scorecard */}
      <DocSection title="Diagnostic — RNF Pillars">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 32, alignItems:'center'}}>
          <PillarRadar scores={pillarScores} size={260}/>
          <div>
            {D.pillars.map(p => (
              <div key={p.id} style={{marginBottom:18}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom: 6}}>
                  <span style={{fontWeight:600}}>{p.name}</span>
                  <span className="mono" style={{fontSize: 12, color:'var(--ink-2)'}}>{(pillarScores[p.id]||0).toFixed(1)} / 10</span>
                </div>
                <div style={{height:5, background:'var(--rule-soft)', borderRadius:3}}>
                  <div style={{height:'100%', width:`${(pillarScores[p.id]||0)*10}%`, background: p.color, borderRadius:3}}></div>
                </div>
                <div style={{fontSize:11, color:'var(--ink-3)', marginTop:4}}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </DocSection>

      {/* Phases */}
      {D.phases.map(phase => (
        <DocSection key={phase.id} title={`Phase ${phase.num} — ${phase.name}: ${phase.subtitle}`} meta={phase.time}>
          <div style={{fontFamily:'var(--serif)', fontStyle:'italic', fontSize:16, color:'var(--ink-2)', marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--rule-soft)'}}>
            {phase.lede}
          </div>

          {phase.steps.filter(s => s.kind !== 'gate').map((step, stepIdx) => {
            const hasContent = (step.fields||[]).some(f => values[f.id]) ||
                              (step.sliders||[]).some(s => values[s.id] != null) ||
                              (step.checklist||[]).some(c => values[c.id]);
            return (
              <div key={step.id} style={{
                marginBottom: 36,
                paddingBottom: 28,
                borderBottom: stepIdx < phase.steps.filter(s=>s.kind!=='gate').length-1
                  ? '2px dashed var(--rule-soft)' : 'none'
              }}>
                {/* Step header */}
                <div style={{
                  display:'flex', justifyContent:'space-between', alignItems:'baseline',
                  marginBottom: 16, paddingBottom: 10,
                  borderBottom: '1px solid var(--rule)'
                }}>
                  <div style={{fontFamily:'var(--serif)', fontSize: 22, fontWeight: 500}}>
                    <span className="mono" style={{fontSize: 11, color:'var(--ink-3)', marginRight: 10}}>{step.num}</span>
                    {step.title}
                  </div>
                  <div className="mono" style={{fontSize: 9, color:'var(--ink-3)', letterSpacing:'0.1em'}}>
                    {step.tagLines.join(' · ').toUpperCase()}
                  </div>
                </div>

                {!hasContent && (
                  <div style={{fontSize: 12, color:'var(--ink-3)', fontStyle:'italic', padding:'8px 0'}}>
                    — No entries yet —
                  </div>
                )}

                {/* Text fields */}
                {(step.fields||[]).filter(f => values[f.id]).map((f, fi) => (
                  <div key={f.id} style={{
                    marginBottom: 20,
                    paddingBottom: fi < (step.fields||[]).filter(fx=>values[fx.id]).length-1 ? 16 : 0,
                    borderBottom: fi < (step.fields||[]).filter(fx=>values[fx.id]).length-1 ? '1px dotted var(--rule-soft)' : 'none'
                  }}>
                    <div className="eyebrow" style={{marginBottom: 6, color:'var(--ink-2)'}}>{f.label}</div>
                    <div style={{fontSize: 13.5, whiteSpace:'pre-wrap', lineHeight: 1.65, color:'var(--ink)'}}>{values[f.id]}</div>
                  </div>
                ))}

                {/* Checklist */}
                {(step.checklist||[]).length > 0 && (
                  <div style={{marginTop: 14, padding: '14px 16px', background:'var(--paper-2)', borderRadius: 4}}>
                    <div className="eyebrow" style={{marginBottom: 10}}>Checklist</div>
                    {step.checklist.map(c => (
                      <div key={c.id} style={{padding:'5px 0', borderBottom:'1px solid var(--rule-soft)', fontSize: 13}}>
                        <div style={{display:'flex', alignItems:'flex-start', gap:8}}>
                          <span style={{fontWeight:600, color: values[c.id] ? 'var(--accent)' : 'var(--ink-4)', flexShrink:0}}>
                            {values[c.id] ? '☑' : '☐'}
                          </span>
                          <span style={{color: values[c.id] ? 'var(--ink)' : 'var(--ink-3)'}}>{c.text}</span>
                        </div>
                        {values[c.id + '_note'] && (
                          <div style={{fontSize:11.5, color:'var(--ink-2)', marginTop:3, marginLeft:20, fontStyle:'italic'}}>
                            {values[c.id + '_note']}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Sliders */}
                {(step.sliders||[]).filter(s => values[s.id] != null).length > 0 && (
                  <div style={{marginTop: 14, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8}}>
                    {step.sliders.filter(s => values[s.id] != null).map(s => (
                      <div key={s.id} style={{
                        display:'flex', justifyContent:'space-between', alignItems:'center',
                        padding:'8px 12px', background:'var(--paper-2)', borderRadius:4,
                        borderLeft: `3px solid var(--accent)`
                      }}>
                        <span style={{fontSize:12, color:'var(--ink-2)'}}>{s.label}</span>
                        <span className="mono" style={{fontWeight:700, fontSize:13}}>{values[s.id]}/10</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Gate result for this phase */}
          {phase.steps.filter(s => s.kind === 'gate').map(g => {
            const met = g.criteria.filter(c => {
              const v = values[c.metric];
              return (typeof v === 'boolean' && v) || (typeof v === 'number' && v >= 6);
            }).length;
            const ratio = met / g.criteria.length;
            const status = ratio >= 0.8 ? 'READY' : ratio >= 0.5 ? 'SOFT-PASS' : 'NOT READY';
            const statusColor = ratio >= 0.8 ? 'var(--accent)' : ratio >= 0.5 ? 'var(--warn)' : 'var(--alchemy)';
            return (
              <div key={g.id} style={{
                marginTop: 20, padding: '16px 20px',
                background:'var(--paper-2)', border:`1px solid ${statusColor}`,
                borderLeft: `4px solid ${statusColor}`, borderRadius:4
              }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 10}}>
                  <div style={{fontFamily:'var(--serif)', fontSize: 17}}>{g.title} — {g.subtitle}</div>
                  <div className="mono" style={{fontSize: 10, letterSpacing:'0.16em', color: statusColor}}>
                    {status} ({met}/{g.criteria.length})
                  </div>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:4}}>
                  {g.criteria.map(c => {
                    const v = values[c.metric];
                    const m = (typeof v === 'boolean' && v) || (typeof v === 'number' && v >= 6);
                    return (
                      <div key={c.id} style={{fontSize:12, padding:'3px 0', display:'flex', gap:8}}>
                        <span style={{color: m ? 'var(--accent)' : 'var(--ink-4)', fontWeight:600}}>{m ? '✓' : '·'}</span>
                        <span style={{color: m ? 'var(--ink)' : 'var(--ink-3)'}}>{c.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </DocSection>
      ))}

      {/* Action items */}
      <DocSection title="Action Items & Next Horizon">
        <ActionItems values={values} D={D} pillarScores={pillarScores}/>
      </DocSection>

      {/* Footer */}
      <div style={{
        marginTop: 40, paddingTop: 16,
        borderTop: '2px solid var(--rule)',
        fontSize: 11, color:'var(--ink-3)', textAlign:'center',
        lineHeight: 1.8, fontFamily: 'var(--mono)', letterSpacing: '0.04em'
      }}>
        Generated {today} · Regenerative Neighborhood Framework v2.0 · Open Sourced by The Regen Tribe Collective =]
      </div>
    </div>
  );
}

function DocSection({ title, meta, children }) {
  return (
    <div style={{marginTop: 40, marginBottom: 8}}>
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'baseline',
        marginBottom: 20, paddingBottom: 8,
        borderBottom: '2px solid var(--ink)'
      }}>
        <div style={{fontFamily:'var(--serif)', fontSize: 24, fontWeight: 500, letterSpacing:'-0.01em'}}>{title}</div>
        {meta && <div className="mono" style={{fontSize:10, letterSpacing:'0.14em', color:'var(--ink-3)'}}>{meta.toUpperCase()}</div>}
      </div>
      {children}
    </div>
  );
}

function ActionItems({ values, D, pillarScores }) {
  const items = [];
  D.pillars.forEach(p => {
    const score = pillarScores[p.id] || 0;
    if (score < 5) {
      items.push({ priority: 'High', pillar: p.name, action: `Strengthen ${p.name} pillar — score ${score.toFixed(1)}/10. Focus on: ${p.desc}.` });
    }
  });
  D.phases.forEach(phase => {
    phase.steps.forEach(step => {
      if (step.kind === 'gate') return;
      (step.fields||[]).forEach(f => {
        if (!values[f.id] || String(values[f.id]).length < 10) {
          items.push({ priority: 'Medium', pillar: `Phase ${phase.num} · ${step.num}`, action: `Complete: ${f.label}` });
        }
      });
    });
  });

  if (items.length === 0) {
    return <div style={{fontStyle:'italic', color:'var(--ink-3)', padding: '12px 0'}}>All foundations look solid. Next horizon: continuous regeneration.</div>;
  }

  return (
    <div>
      {items.slice(0, 12).map((it, i) => (
        <div key={i} style={{
          display:'grid', gridTemplateColumns:'80px 160px 1fr', gap: 16,
          padding:'10px 0', borderBottom:'1px dashed var(--rule-soft)', fontSize: 13,
          alignItems:'start'
        }}>
          <div className="mono" style={{
            fontSize: 10, letterSpacing:'0.1em',
            color: it.priority === 'High' ? 'var(--alchemy)' : 'var(--ink-3)',
            fontWeight: it.priority === 'High' ? 700 : 400
          }}>{it.priority.toUpperCase()}</div>
          <div className="mono" style={{fontSize: 11, color:'var(--ink-2)'}}>{it.pillar}</div>
          <div style={{color:'var(--ink-2)'}}>{it.action}</div>
        </div>
      ))}
      {items.length > 12 && <div style={{fontSize: 11, color:'var(--ink-3)', marginTop: 10, fontStyle:'italic'}}>… and {items.length - 12} more items to address</div>}
    </div>
  );
}

function downloadAsMarkdown(values) {
  const D = window.FW_DATA;
  const pillarScores = computePillarScores(values);
  const overall = Object.values(pillarScores).reduce((a, b) => a + b, 0) / 5;
  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const projectName = values.project_name || 'Untitled Regenerative Neighborhood';

  let md = `# ${projectName}\n\n`;
  md += `> *${values.vision_statement || 'A regenerative neighborhood in formation.'}*\n\n`;
  md += `| Field | Value |\n|-------|-------|\n`;
  md += `| Date | ${today} |\n`;
  md += `| Overall Score | ${overall.toFixed(1)} / 10 |\n`;
  md += `| Frameworks | RNF · Alchemy · RCOS · CLIPS |\n`;
  md += `| Version | v2.0 |\n\n`;
  md += `---\n\n`;

  // Pillars
  md += `## Diagnostic — RNF Pillars\n\n`;
  md += `| Pillar | Score | Description |\n|--------|-------|-------------|\n`;
  D.pillars.forEach(p => {
    md += `| ${p.name} | ${(pillarScores[p.id]||0).toFixed(1)} / 10 | ${p.desc} |\n`;
  });
  md += `\n---\n\n`;

  // Phases
  D.phases.forEach(phase => {
    md += `## Phase ${phase.num} — ${phase.name}: ${phase.subtitle}\n\n`;
    md += `*${phase.time}*\n\n`;
    md += `${phase.lede}\n\n`;

    phase.steps.filter(s => s.kind !== 'gate').forEach(step => {
      md += `### ${step.num} — ${step.title}\n\n`;
      md += `*${step.tagLines.join(' · ')}*\n\n`;

      let hasContent = false;

      (step.fields||[]).forEach(f => {
        if (values[f.id]) {
          hasContent = true;
          md += `**${f.label}**\n\n${values[f.id]}\n\n`;
        }
      });

      const scoredSliders = (step.sliders||[]).filter(s => values[s.id] != null);
      if (scoredSliders.length > 0) {
        hasContent = true;
        md += `**Self-Assessment:**\n\n`;
        scoredSliders.forEach(s => { md += `- ${s.label}: **${values[s.id]} / 10**\n`; });
        md += `\n`;
      }

      if ((step.checklist||[]).length > 0) {
        hasContent = true;
        md += `**Checklist:**\n\n`;
        step.checklist.forEach(c => {
          md += `- [${values[c.id] ? 'x' : ' '}] ${c.text}\n`;
          if (values[c.id + '_note']) md += `  > ${values[c.id + '_note']}\n`;
        });
        md += `\n`;
      }

      if (!hasContent) md += `*No entries yet.*\n\n`;
      md += `---\n\n`;
    });

    phase.steps.filter(s => s.kind === 'gate').forEach(g => {
      const met = g.criteria.filter(c => {
        const v = values[c.metric];
        return (typeof v === 'boolean' && v) || (typeof v === 'number' && v >= 6);
      }).length;
      const status = met/g.criteria.length >= 0.8 ? 'READY' : met/g.criteria.length >= 0.5 ? 'SOFT-PASS' : 'NOT READY';
      md += `> **Gate ${g.gateNum === 34 ? '3·4' : g.gateNum}:** ${g.title} — **${status}** (${met}/${g.criteria.length})\n\n`;
    });
  });

  // Action items
  md += `## Action Items & Next Horizon\n\n`;
  let hasActions = false;
  D.pillars.forEach(p => {
    const score = pillarScores[p.id] || 0;
    if (score < 5) {
      hasActions = true;
      md += `- **HIGH** | ${p.name} | Strengthen ${p.name} — score ${score.toFixed(1)}/10\n`;
    }
  });
  D.phases.forEach(phase => {
    phase.steps.forEach(step => {
      if (step.kind === 'gate') return;
      (step.fields||[]).forEach(f => {
        if (!values[f.id] || String(values[f.id]).length < 10) {
          hasActions = true;
          md += `- **MEDIUM** | Phase ${phase.num} · ${step.num} | Complete: ${f.label}\n`;
        }
      });
    });
  });
  if (!hasActions) md += `All foundations look solid. Next horizon: continuous regeneration.\n`;

  md += `\n---\n\n`;
  md += `*Generated ${today} · Regenerative Neighborhood Framework v2.0 · Open Sourced by The Regen Tribe Collective =]*\n`;

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `regen-neighborhood-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

Object.assign(window, { ProjectDocumentView });
