import React from 'react';

const STAGES = [
  'Inoculation',
  'Incubation',
  'Colonisation',
  'Pinning',
  'Fruiting',
  'Harvest',
];

export default function GrowCycleStepper({ activeBatch }) {
  const batchCode = activeBatch?.code || 'Batch 01';
  const stageName = activeBatch?.currentStage || 'Pinning';

  const normalizedStage = stageName.toLowerCase();
  const currentIndex = STAGES.findIndex((s) => s.toLowerCase() === normalizedStage);
  const activeIdx = currentIndex >= 0 ? currentIndex : 3;

  return (
    <div className="stepper-card">
      <div className="stepper-title">Grow cycle — {batchCode}</div>
      <div className="stepper-sub">
        Stage: <b>{STAGES[activeIdx]}</b> · Cultivation cycle active
      </div>

      <div className="stepper-track">
        {STAGES.map((stage, i) => {
          let circleCls = '';
          let lineCls = '';
          let labelCls = '';
          let icon = String(i + 1);

          if (i < activeIdx) {
            circleCls = 'done';
            lineCls = 'done';
            icon = '✓';
          } else if (i === activeIdx) {
            circleCls = 'active';
            lineCls = 'done';
            labelCls = 'active';
          }

          return (
            <div key={stage} className="step">
              <div className={`step-line ${lineCls}`}></div>
              <div className={`step-circle ${circleCls}`}>{icon}</div>
              <div className={`step-label ${labelCls}`}>{stage}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
