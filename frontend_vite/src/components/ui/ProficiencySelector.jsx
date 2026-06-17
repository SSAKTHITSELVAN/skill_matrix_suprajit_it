const LEVELS = [
  { value: 'BEGINNER', label: 'Beginner', unselected: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100', selected: 'bg-green-200 border-green-400 text-green-900' },
  { value: 'MEDIUM', label: 'Medium', unselected: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100', selected: 'bg-amber-200 border-amber-400 text-amber-900' },
  { value: 'EXPERT', label: 'Expert', unselected: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100', selected: 'bg-blue-200 border-blue-400 text-blue-900' },
  { value: 'MASTER', label: 'Master', unselected: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100', selected: 'bg-purple-200 border-purple-400 text-purple-900' },
];

export default function ProficiencySelector({ topicId, topicName, selectedLevel, onChange, disabled }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3.5 space-y-3 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-medium text-gray-900 text-sm flex-1">{topicName}</h4>
        {selectedLevel && (
          <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-700">
            {LEVELS.find(l => l.value === selectedLevel)?.label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {LEVELS.map(level => (
          <button
            key={level.value}
            onClick={() => onChange(level.value)}
            disabled={disabled}
            className={`py-2 px-1.5 rounded border font-medium text-xs transition-all duration-150 ${
              selectedLevel === level.value ? level.selected : level.unselected
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  );
}
