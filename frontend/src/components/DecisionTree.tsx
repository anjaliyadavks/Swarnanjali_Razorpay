import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#e0f2fe',
    primaryTextColor: '#0f172a',
    primaryBorderColor: '#38bdf8',
    lineColor: '#94a3b8',
    secondaryColor: '#f1f5f9',
    tertiaryColor: '#fff'
  }
});

interface Props {
  chartDefinition: string;
}

export default function DecisionTree({ chartDefinition }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    
    if (containerRef.current && chartDefinition) {
      const id = `mermaid-chart-${Math.random().toString(36).substr(2, 9)}`;
      
      // Clear previous content
      containerRef.current.innerHTML = '';
      
      try {
        mermaid.render(id, chartDefinition).then((result) => {
          if (isMounted && containerRef.current) {
            containerRef.current.innerHTML = result.svg;
          }
        }).catch((e) => {
          console.error("Mermaid render error", e);
          if (isMounted && containerRef.current) {
            containerRef.current.innerHTML = `<div class="text-red-500">Failed to render decision tree. Check console for details.</div>`;
          }
        });
      } catch (e) {
        console.error("Mermaid sync render error", e);
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, [chartDefinition]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 overflow-x-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Decision Tree (Strategy & Orchestration)</h2>
      <div ref={containerRef} className="flex justify-center" />
    </div>
  );
}
