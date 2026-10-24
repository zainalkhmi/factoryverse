/**
 * FactoryVerse Studio - Quality Inspection & Tolerance Engine View
 * Interactive dimensional verification laboratory and tolerance rules visualizer.
 */

import {
  InspectionEngine,
  DEFAULT_CYLINDER_INSPECTION_RULE,
  type InspectionResult,
} from '../../inspection/inspection-engine';

export function renderQualityInspectionView(
  container: HTMLElement,
  _onNavigate: (viewId: string, param?: string) => void
): void {
  const engine = new InspectionEngine(DEFAULT_CYLINDER_INSPECTION_RULE);
  let latestResult: InspectionResult | null = null;
  let testValue = '24.02';

  const render = () => {
    const rule = engine.getRule();
    const history = engine.getHistory();

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 700; color: #fff;">Quality Assurance & Inspection Engine</h2>
          <p style="font-size: 13px; color: var(--text-secondary);">Dimensional verification rules, tolerance boundary testing, and precision acceptance gates.</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 420px 1fr; gap: 20px;">
        <!-- Left: Interactive Tolerance Tester -->
        <div class="editor-column" style="height: auto;">
          <div class="editor-col-header">
            <span class="editor-col-title">Live Tolerance Simulator</span>
            <span class="badge badge-published">ISO 2768-m</span>
          </div>
          <div class="editor-col-body">
            <div style="background-color: #0d1724; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 16px;">
              <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Active Specification</div>
              <div style="font-size: 16px; font-weight: 700; color: #fff; margin-top: 4px;">${rule.parameterName}</div>
              <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
                Nominal: <strong style="color: #fff;">${rule.nominalValue.toFixed(2)} ${rule.unit}</strong> (Tolerance: ±${rule.tolerance.toFixed(2)} ${rule.unit})
              </div>
              <div style="font-size: 12px; color: var(--accent-amber); margin-top: 4px;">
                Acceptable Range: <strong>[${rule.minAcceptable.toFixed(2)} – ${rule.maxAcceptable.toFixed(2)}] ${rule.unit}</strong>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Simulate Measured Input (${rule.unit})</label>
              <div style="display: flex; gap: 10px;">
                <input id="qi-input-val" type="text" class="form-input" value="${testValue}" placeholder="Enter reading e.g. 24.00" />
                <button id="qi-btn-evaluate" class="btn btn-primary">Evaluate</button>
              </div>
              <span style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 6px;">
                * Simulated manual caliper input for operator training certification.
              </span>
            </div>

            <!-- Quick Preset Test Cases -->
            <div class="form-group">
              <label class="form-label">Preset Test Boundary Cases</label>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button class="btn btn-secondary btn-sm qi-preset-btn" data-val="24.00">Nominal (24.00)</button>
                <button class="btn btn-secondary btn-sm qi-preset-btn" data-val="23.90">Lower Limit (23.90)</button>
                <button class="btn btn-secondary btn-sm qi-preset-btn" data-val="24.10">Upper Limit (24.10)</button>
                <button class="btn btn-danger btn-sm qi-preset-btn" data-val="23.85">Below Tol (23.85)</button>
                <button class="btn btn-danger btn-sm qi-preset-btn" data-val="24.18">Above Tol (24.18)</button>
                <button class="btn btn-secondary btn-sm qi-preset-btn" data-val="">Empty / Invalid</button>
              </div>
            </div>

            <!-- Result Card -->
            ${
              latestResult
                ? `
              <div style="background-color: ${latestResult.state === 'PASS' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)'}; border: 1px solid ${latestResult.state === 'PASS' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}; border-radius: var(--radius-sm); padding: 14px; margin-top: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <span class="badge ${latestResult.state === 'PASS' ? 'badge-pass' : 'badge-fail'}">
                    RESULT: ${latestResult.state}
                  </span>
                  <span style="font-size: 12px; font-weight: 700; color: #fff;">
                    Deviation: ${latestResult.deviation !== null ? (latestResult.deviation >= 0 ? '+' : '') + latestResult.deviation.toFixed(2) + ' ' + rule.unit : 'N/A'}
                  </span>
                </div>
                <div style="font-size: 13px; color: #f8fafc; line-height: 1.4;">
                  ${latestResult.message}
                </div>
              </div>
            `
                : ''
            }
          </div>
        </div>

        <!-- Right: Real-time Evaluation History -->
        <div class="table-card" style="margin-bottom: 0;">
          <div class="table-header-bar">
            <span class="table-title">Session Evaluation History (${history.length})</span>
            <button id="qi-btn-clear-hist" class="btn btn-secondary btn-sm">Clear History</button>
          </div>
          <table class="custom-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Raw Input</th>
                <th>Value</th>
                <th>Deviation</th>
                <th>Result</th>
                <th>Evaluation Details</th>
              </tr>
            </thead>
            <tbody>
              ${
                history.length === 0
                  ? `<tr><td colspan="6" style="text-align: center; padding: 36px; color: var(--text-muted);">No evaluations recorded yet. Run tests on the left.</td></tr>`
                  : [...history]
                      .reverse()
                      .map(
                        (h) => `
                <tr>
                  <td style="font-size: 11px; font-family: var(--font-mono);">${new Date(h.timestamp).toLocaleTimeString()}</td>
                  <td><code>"${h.rawInput}"</code></td>
                  <td>${h.measuredValue !== null ? h.measuredValue.toFixed(2) + ' ' + rule.unit : '—'}</td>
                  <td style="font-weight: 600; color: ${h.deviation === null ? 'var(--text-muted)' : Math.abs(h.deviation) <= 0.1 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}">
                    ${h.deviation !== null ? (h.deviation >= 0 ? '+' : '') + h.deviation.toFixed(2) : '—'}
                  </td>
                  <td>
                    <span class="badge ${h.state === 'PASS' ? 'badge-pass' : 'badge-fail'}">${h.state}</span>
                  </td>
                  <td style="font-size: 12px; max-width: 280px;">${h.message}</td>
                </tr>
              `
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Handlers
    const runEval = (val: string) => {
      testValue = val;
      latestResult = engine.evaluate(val);
      render();
    };

    container.querySelector('#qi-btn-evaluate')?.addEventListener('click', () => {
      const val = (container.querySelector('#qi-input-val') as HTMLInputElement)?.value;
      runEval(val);
    });

    container.querySelectorAll('.qi-preset-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const val = (e.currentTarget as HTMLElement).getAttribute('data-val') ?? '';
        runEval(val);
      });
    });

    container.querySelector('#qi-btn-clear-hist')?.addEventListener('click', () => {
      engine.clearHistory();
      latestResult = null;
      render();
    });
  };

  render();
}
