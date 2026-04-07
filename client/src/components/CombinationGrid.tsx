import { useMemo } from 'react';

interface CombinationGridProps {
  combinations: number[][];
}

export default function CombinationGrid({ combinations }: CombinationGridProps) {
  const chunked = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < combinations.length; i += 2) {
      chunks.push(combinations.slice(i, i + 2));
    }
    return chunks;
  }, [combinations]);

  return (
    <div className="space-y-2">
      {chunked.map((row, rowIdx) => (
        <div key={rowIdx} className="grid grid-cols-2 gap-2">
          {row.map((combo, colIdx) => (
            <div
              key={`${rowIdx}-${colIdx}`}
              className="p-4 bg-secondary border border-border rounded hover:border-accent transition-colors"
            >
              <div className="text-center font-mono font-bold text-lg tracking-widest">
                {combo.join('')}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
