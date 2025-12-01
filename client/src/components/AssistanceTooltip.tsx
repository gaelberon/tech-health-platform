import React, { useState } from 'react';

type AssistanceTooltipProps = {
  content: string;
};

/**
 * Lightweight tooltip suited for inline labels in the Collector stepper.
 * Uses native title fallback for accessibility while providing a styled bubble.
 */
const AssistanceTooltip: React.FC<AssistanceTooltipProps> = ({ content }) => {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label="Afficher l'assistance"
        className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-blue-300 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        title={content}
      >
        ?
      </button>
      {visible && (
        <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
          {content}
        </div>
      )}
    </span>
  );
};

export default AssistanceTooltip;

