import React, { useMemo } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { useMockGitHubData } from '../hooks/useDataFetching';
import { GitHubActivityChart } from '../components';

const GitHubStatsPage: React.FC = () => {
  const { state } = useDashboard();
  const { selectedPeriod } = state;

  const { data: githubData, loading, error } = useMockGitHubData(selectedPeriod);

  const stats = useMemo(() => {
    if (githubData.length === 0) return null;

    const totalCommits = githubData.reduce((sum, day) => sum + day.commits, 0);
    const totalStars = githubData.reduce((sum, day) => sum + day.stars, 0);
    const totalPRs = githubData.reduce((sum, day) => sum + day.pullRequests, 0);
    const totalContributors = githubData.reduce((sum, day) => sum + day.contributors, 0);

    const avgCommitsPerDay = Math.round(totalCommits / githubData.length);
    const avgStarsPerDay = Math.round(totalStars / githubData.length);

    // Find peak days
    const maxCommitsDay = githubData.reduce((max, day) => day.commits > max.commits ? day : max);
    const maxStarsDay = githubData.reduce((max, day) => day.stars > max.stars ? day : max);

    // Weekly distribution
    const weekdayActivity = Array(7).fill(0);
    githubData.forEach(day => {
      const weekday = new Date(day.date).getDay();
      weekdayActivity[weekday] += day.commits;
    });

    // Find busiest day
    const busiestDayIndex = weekdayActivity.indexOf(Math.max(...weekdayActivity));

    return {
      totalCommits,
      totalStars,
      totalPRs,
      totalContributors,
      avgCommitsPerDay,
      avgStarsPerDay,
      maxCommitsDay,
      maxStarsDay,
      weekdayActivity,
      busiestDayIndex
    };
  }, [githubData]);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdaysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Insight-led descriptions
  const activityLevel = stats ? (stats.avgCommitsPerDay > 1000 ? 'High' : stats.avgCommitsPerDay > 500 ? 'Moderate' : 'Low') : '';
  const busiestDay = stats ? weekdaysFull[stats.busiestDayIndex] : '';

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 cursor-default" title="Total code changes submitted to repositories">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Commits</span>
            {loading && <span className="loading loading-spinner loading-xs" />}
          </div>
          <div className="text-2xl font-bold text-base-content tracking-tight">
            {stats?.totalCommits.toLocaleString() || '0'}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${activityLevel === 'High' ? 'bg-success' : activityLevel === 'Moderate' ? 'bg-warning' : 'bg-base-content/30'}`} />
            <span className="text-xs text-base-content/50 font-medium">{stats?.avgCommitsPerDay.toLocaleString() || 0}/day</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 cursor-default" title="Community interest - users who bookmarked the project">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Stars</span>
            {loading && <span className="loading loading-spinner loading-xs" />}
          </div>
          <div className="text-2xl font-bold text-base-content tracking-tight">
            {stats?.totalStars.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-base-content/50 mt-1.5 font-medium">
            {stats?.avgStarsPerDay.toLocaleString() || 0}/day avg
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 cursor-default" title="Proposed code contributions from developers">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">PRs</span>
            {loading && <span className="loading loading-spinner loading-xs" />}
          </div>
          <div className="text-2xl font-bold text-base-content tracking-tight">
            {stats?.totalPRs.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-base-content/50 mt-1.5 font-medium">Pull requests</div>
        </div>

        <div className="glass-card rounded-xl p-4 cursor-default" title="Number of active developers contributing">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Devs</span>
            {loading && <span className="loading loading-spinner loading-xs" />}
          </div>
          <div className="text-2xl font-bold text-base-content tracking-tight">
            {stats?.totalContributors.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-base-content/50 mt-1.5 font-medium">Contributors</div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-base-content">{activityLevel} Development Activity</h3>
          <span className="text-xs text-base-content/40 font-medium">{selectedPeriod}D</span>
        </div>
        <p className="text-xs text-base-content/50 mb-4 leading-relaxed">Daily commits · Hover for details</p>
        <div className="h-72">
          <GitHubActivityChart
            data={githubData}
            loading={loading}
            error={error}
            height={270}
          />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Days */}
        {stats && (
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-base-content">Peak Days</h3>
              <span className="text-xs text-base-content/40 font-medium">Records</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors cursor-default" title="Day with highest number of commits">
                <div>
                  <div className="text-[10px] text-base-content/50 uppercase tracking-wider font-semibold mb-0.5">Peak Commits</div>
                  <div className="font-bold text-primary tracking-tight">{stats.maxCommitsDay.commits.toLocaleString()}</div>
                </div>
                <div className="text-xs text-base-content/50 font-medium">
                  {new Date(stats.maxCommitsDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-warning/5 rounded-lg border border-warning/20 hover:bg-warning/10 transition-colors cursor-default" title="Day with highest number of stars">
                <div>
                  <div className="text-[10px] text-base-content/50 uppercase tracking-wider font-semibold mb-0.5">Peak Stars</div>
                  <div className="font-bold text-warning tracking-tight">{stats.maxStarsDay.stars.toLocaleString()}</div>
                </div>
                <div className="text-xs text-base-content/50 font-medium">
                  {new Date(stats.maxStarsDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Pattern */}
        {stats && (
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-base-content">Weekly Pattern</h3>
              <span className="text-xs text-primary font-medium">{busiestDay}s busiest</span>
            </div>
            <p className="text-xs text-base-content/50 mb-4 leading-relaxed">Commit distribution by weekday</p>
            <div className="space-y-2">
              {weekdays.map((day, index) => {
                const activity = stats.weekdayActivity[index];
                const maxActivity = Math.max(...stats.weekdayActivity);
                const percentage = maxActivity > 0 ? (activity / maxActivity) * 100 : 0;
                const isBusiest = index === stats.busiestDayIndex;
                return (
                  <div key={day} className="flex items-center gap-3 group">
                    <div className={`w-8 text-xs font-medium ${isBusiest ? 'text-primary' : 'text-base-content/50'}`}>{day}</div>
                    <div className="flex-1 bg-base-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${isBusiest ? 'bg-primary' : 'bg-base-content/30'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className={`w-16 text-xs text-right font-medium ${isBusiest ? 'text-primary' : 'text-base-content/40'}`}>{activity.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Data Source Info */}
      <div className="glass-card rounded-xl p-3 bg-base-200/30">
        <div className="flex items-center gap-2 text-xs text-base-content/40">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Simulated data · {selectedPeriod} day period</span>
        </div>
      </div>
    </div>
  );
};

export default GitHubStatsPage;
