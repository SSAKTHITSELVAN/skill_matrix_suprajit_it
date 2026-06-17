import { BarChart3, Zap } from 'lucide-react';
import Card, { CardContent, CardHeader } from './ui/Card';
import Badge from './ui/Badge';

const LEVEL_COLORS = {
  BEGINNER: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100' },
  MEDIUM: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100' },
  EXPERT: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100' },
  MASTER: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100' },
};

export default function SkillBreakdownView({ breakdown }) {
  if (!breakdown) return null;

  const { topic_breakdown, score_calculation } = breakdown;

  return (
    <div className="space-y-4">
      {/* Score Summary */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand" />
            Score Breakdown
          </h3>
          <div className="text-right">
            <div className="text-3xl font-bold text-brand">{breakdown.calculated_level}</div>
            <div className="text-xs text-gray-500">out of 100</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Level Distribution */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-semibold text-gray-600 mb-2">Level Distribution</div>
            <div className="grid grid-cols-4 gap-2">
              {['BEGINNER', 'MEDIUM', 'EXPERT', 'MASTER'].map(level => (
                <div key={level} className="text-center">
                  <div className={`text-2xl font-bold ${LEVEL_COLORS[level].text}`}>
                    {score_calculation.level_distribution[level]}
                  </div>
                  <div className="text-[11px] text-gray-500">{level}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Calculation Details */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-semibold text-gray-600 mb-2">Calculation</div>
            <div className="text-sm text-gray-700">
              <div className="flex justify-between mb-1">
                <span>Selected Topics:</span>
                <span className="font-medium">{score_calculation.selected_topics}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Level Score:</span>
                <span className="font-medium">
                  {(
                    (score_calculation.level_distribution.BEGINNER * 1 +
                      score_calculation.level_distribution.MEDIUM * 2 +
                      score_calculation.level_distribution.EXPERT * 3 +
                      score_calculation.level_distribution.MASTER * 4) /
                    score_calculation.selected_topics
                  ).toFixed(2)}
                  x 10
                </span>
              </div>
            </div>
          </div>

          {/* Target vs Current */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-50 rounded p-2 border border-blue-100">
              <div className="text-xs text-gray-600">Current Score</div>
              <div className="text-xl font-bold text-blue-700">{breakdown.calculated_level}/100</div>
            </div>
            <div className="bg-purple-50 rounded p-2 border border-purple-100">
              <div className="text-xs text-gray-600">Target Score</div>
              <div className="text-xl font-bold text-purple-700">{breakdown.target_level}/100</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topic-wise Breakdown */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Topic Proficiency Details
          </h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {topic_breakdown.map(topic => (
            <div
              key={topic.topic_id}
              className={`p-3 rounded-lg border-2 ${
                topic.proficiency_level
                  ? `${LEVEL_COLORS[topic.proficiency_level].bg} ${LEVEL_COLORS[topic.proficiency_level].border}`
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm">{topic.topic_name}</div>
                </div>
                {topic.proficiency_level && (
                  <Badge className={`ml-auto flex-shrink-0 ${LEVEL_COLORS[topic.proficiency_level].badge}`}>
                    {topic.proficiency_level}
                  </Badge>
                )}
                {!topic.proficiency_level && (
                  <span className="text-xs text-gray-500 ml-auto flex-shrink-0">Not selected</span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
