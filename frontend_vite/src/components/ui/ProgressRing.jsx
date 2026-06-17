export default function ProgressRing({ value, max = 10, size = 48, strokeWidth = 3, color }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / max) * circumference;

  const levelColor = color || (
    value <= 3 ? '#FF3B30' :
    value <= 5 ? '#FF9500' :
    value <= 7 ? '#007AFF' :
    '#34C759'
  );

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F5F5F7"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={levelColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-[11px] font-bold text-[#1d1d1f]">
        {value}
      </span>
    </div>
  );
}
