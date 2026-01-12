import { Check } from 'lucide-react'

export function Stepper({ steps, currentStep, onStepClick, className = '' }) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isClickable = onStepClick && (isCompleted || isCurrent)

          return (
            <li
              key={step.id || step.label}
              className={`relative ${index !== steps.length - 1 ? 'flex-1 pr-8 sm:pr-20' : ''}`}
            >
              <div className="flex items-center">
                {/* Step circle */}
                <button
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'bg-primary-600 text-white'
                      : isCurrent
                      ? 'border-2 border-primary-600 bg-white text-primary-600'
                      : 'border-2 border-slate-300 bg-white text-slate-500'
                  } ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Connector line */}
                {index !== steps.length - 1 && (
                  <div
                    className={`absolute left-8 top-4 h-0.5 w-full ${
                      isCompleted ? 'bg-primary-600' : 'bg-slate-300'
                    }`}
                    style={{ transform: 'translateY(-50%)' }}
                  />
                )}
              </div>

              {/* Step label */}
              <div className="mt-2">
                <span
                  className={`text-xs font-medium ${
                    isCurrent ? 'text-primary-600' : isCompleted ? 'text-slate-900' : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Vertical stepper for mobile or sidebar
export function VerticalStepper({ steps, currentStep, onStepClick, className = '' }) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isClickable = onStepClick && (isCompleted || isCurrent)

          return (
            <li key={step.id || step.label} className="relative">
              <div className="flex items-start">
                {/* Connector line */}
                {index !== steps.length - 1 && (
                  <div
                    className={`absolute left-4 top-8 h-full w-0.5 -ml-px ${
                      isCompleted ? 'bg-primary-600' : 'bg-slate-300'
                    }`}
                  />
                )}

                {/* Step circle */}
                <button
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'bg-primary-600 text-white'
                      : isCurrent
                      ? 'border-2 border-primary-600 bg-white text-primary-600'
                      : 'border-2 border-slate-300 bg-white text-slate-500'
                  } ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Step content */}
                <div className="ml-4 min-w-0 flex-1">
                  <span
                    className={`text-sm font-medium ${
                      isCurrent ? 'text-primary-600' : isCompleted ? 'text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <p className="mt-1 text-xs text-slate-500">{step.description}</p>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Workflow timeline for showing paket progress
export function WorkflowTimeline({ stages, currentStage, className = '' }) {
  const currentIndex = stages.findIndex((s) => s.value === currentStage)

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {stages.map((stage, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const isPending = index > currentIndex

        return (
          <div key={stage.value} className="flex items-center">
            <div
              className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                isCompleted
                  ? 'bg-success-100 text-success-700'
                  : isCurrent
                  ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500'
                  : 'bg-slate-100 text-slate-500'
              }`}
              title={stage.label}
            >
              {stage.label}
            </div>
            {index < stages.length - 1 && (
              <div
                className={`w-4 h-0.5 mx-1 ${
                  isCompleted ? 'bg-success-500' : 'bg-slate-300'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default Stepper
