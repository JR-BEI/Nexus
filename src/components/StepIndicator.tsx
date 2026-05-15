interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
  labels?: [string, string, string];
}

export function StepIndicator({
  currentStep,
  labels = ["Input", "Analysis", "Outputs"],
}: StepIndicatorProps) {
  return (
    <div className="step-indicator">
      {labels.map((label, idx) => {
        const stepNum = idx + 1;
        const state =
          stepNum < currentStep
            ? "complete"
            : stepNum === currentStep
              ? "active"
              : "pending";
        return (
          <div key={label} className="step-indicator-item">
            <div className={`step-circle step-${state}`}>
              {state === "complete" ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M3 7L6 10L11 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                stepNum
              )}
            </div>
            <span className="step-label">{label}</span>
            {stepNum < 3 && (
              <div
                className={`step-connector step-connector-${
                  state === "complete" ? "complete" : "pending"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
