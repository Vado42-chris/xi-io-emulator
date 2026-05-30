import React from 'react';
import { CheckCircle2, AlertTriangle, Circle, MinusCircle, XCircle } from 'lucide-react';
import type { GameIngressChecklist, IngressChecklistStepStatus } from '../data/gameModels';
import { INGRESS_CHECKLIST_STEPS } from '../data/ingressChecklistDefinition';

interface IngressChecklistPanelProps {
  checklist?: GameIngressChecklist;
  compact?: boolean;
}

const statusIcon = (status: IngressChecklistStepStatus) => {
  switch (status) {
    case 'passed':
      return <CheckCircle2 size={14} className="ingress-step-icon ingress-step-icon--passed" />;
    case 'warning':
      return <AlertTriangle size={14} className="ingress-step-icon ingress-step-icon--warning" />;
    case 'failed':
      return <XCircle size={14} className="ingress-step-icon ingress-step-icon--failed" />;
    case 'skipped':
      return <MinusCircle size={14} className="ingress-step-icon ingress-step-icon--skipped" />;
    default:
      return <Circle size={14} className="ingress-step-icon ingress-step-icon--pending" />;
  }
};

export const IngressChecklistPanel: React.FC<IngressChecklistPanelProps> = ({
  checklist,
  compact = false,
}) => {
  if (!checklist) {
    return (
      <div className="ingress-checklist ingress-checklist--empty">
        <p>Ingress checklist not validated yet. Reconcile library from Admin → Library.</p>
      </div>
    );
  }

  const stepMap = new Map(checklist.steps.map((step) => [step.id, step]));

  return (
    <div className={`ingress-checklist ${compact ? 'ingress-checklist--compact' : ''}`}>
      <div className="ingress-checklist-header">
        <div>
          <h4 className="ingress-checklist-title">Ingress Checklist</h4>
          <p className="ingress-checklist-subtitle">
            {checklist.passedCount} / {checklist.totalRequired} required steps
            {checklist.complete ? ' — fully ingressed' : ' — in progress'}
          </p>
        </div>
        <div className="ingress-checklist-percent">{checklist.percentComplete}%</div>
      </div>

      <div className="ingress-checklist-progress">
        <div
          className="ingress-checklist-progress-fill"
          style={{ width: `${checklist.percentComplete}%` }}
        />
      </div>

      <ul className="ingress-checklist-steps">
        {INGRESS_CHECKLIST_STEPS.map((def) => {
          const step = stepMap.get(def.id);
          if (!step || step.status === 'skipped') {
            return null;
          }
          return (
            <li key={def.id} className={`ingress-checklist-step ingress-checklist-step--${step.status}`}>
              {statusIcon(step.status)}
              <div className="ingress-checklist-step-body">
                <span className="ingress-checklist-step-label">{def.label}</span>
                {!compact && step.message && (
                  <span className="ingress-checklist-step-message">{step.message}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {checklist.lastValidatedAt && !compact && (
        <p className="ingress-checklist-validated">
          Last validated {new Date(checklist.lastValidatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
};

interface LibraryIngressSummaryBarProps {
  total: number;
  fullyIngested: number;
  partial: number;
  failed: number;
  percentComplete: number;
  onReconcile?: () => void;
  reconciling?: boolean;
}

export const LibraryIngressSummaryBar: React.FC<LibraryIngressSummaryBarProps> = ({
  total,
  fullyIngested,
  partial,
  failed,
  percentComplete,
  onReconcile,
  reconciling = false,
}) => (
  <div className="library-ingress-summary">
    <div className="library-ingress-summary-text">
      <strong>Ingress progress:</strong> {fullyIngested} / {total} fully ingressed ({percentComplete}%)
      {partial > 0 && ` · ${partial} partial`}
      {failed > 0 && ` · ${failed} need attention`}
    </div>
    <div className="library-ingress-summary-bar">
      <div className="library-ingress-summary-fill" style={{ width: `${percentComplete}%` }} />
    </div>
    {onReconcile && (
      <button type="button" className="btn-secondary" onClick={onReconcile} disabled={reconciling}>
        {reconciling ? 'Validating…' : 'Reconcile All Games'}
      </button>
    )}
  </div>
);

interface BatchIngressProgressPanelProps {
  scanId: string;
  folderPath: string;
  status: 'running' | 'completed' | 'failed';
  filesTotal: number;
  filesProcessed: number;
  gamesAdded: number;
  gamesFullyIngested: number;
  gamesSkipped: number;
  currentFileName?: string;
}

export const BatchIngressProgressPanel: React.FC<BatchIngressProgressPanelProps> = ({
  folderPath,
  status,
  filesTotal,
  filesProcessed,
  gamesAdded,
  gamesFullyIngested,
  gamesSkipped,
  currentFileName,
}) => {
  const percent = filesTotal === 0 ? 0 : Math.round((filesProcessed / filesTotal) * 100);

  return (
    <div className={`batch-ingress-progress batch-ingress-progress--${status}`}>
      <div className="batch-ingress-progress-header">
        <strong>{status === 'running' ? 'Batch ingress in progress' : 'Batch ingress complete'}</strong>
        <span>{percent}%</span>
      </div>
      <div className="batch-ingress-progress-bar">
        <div className="batch-ingress-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="batch-ingress-progress-meta">
        {folderPath} · {filesProcessed}/{filesTotal} files · {gamesAdded} added · {gamesFullyIngested}{' '}
        fully ingressed · {gamesSkipped} skipped
      </p>
      {currentFileName && status === 'running' && (
        <p className="batch-ingress-progress-current">Processing: {currentFileName}</p>
      )}
    </div>
  );
};
