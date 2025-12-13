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

    return {
      totalCommits,
      totalStars,
      totalPRs,
      totalContributors,
      avgCommitsPerDay,
      avgStarsPerDay,
      maxCommitsDay,
      maxStarsDay,
      weekdayActivity
    };
  }, [githubData]);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-base-content/60 uppercase tracking-wide">Commits</span>
            {loading && <span className="loading loading-spinner loading-xs" />}
          </div>
          <div className="text-2xl font-bold text-base-content">
            {stats?.totalCommits.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-base-content/50 mt-1">
            {stats?.avgCommitsPerDay.toLocaleString() || 0}/day avg
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">Stars</div>
          <div className="text-2xl font-bold text-base-content">
            {stats?.totalStars.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-base-content/50 mt-1">
            {stats?.avgStarsPerDay.toLocaleString() || 0}/day avg
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">Pull Requests</div>
          <div className="text-2xl font-bold text-base-content">
            {stats?.totalPRs.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-base-content/50 mt-1">Total PRs opened</div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">Contributors</div>
          <div className="text-2xl font-bold text-base-content">
            {stats?.totalContributors.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-base-content/50 mt-1">Active developers</div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold text-base-content mb-4">Activity Timeline</h3>
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
            <h3 className="text-sm font-semibold text-base-content mb-4">Peak Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg">
                <div>
                  <div className="text-xs text-base-content/60">Most Commits</div>
                  <div className="font-semibold">{stats.maxCommitsDay.commits.toLocaleString()}</div>
                </div>
                <div className="text-xs text-base-content/50">
                  {new Date(stats.maxCommitsDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg">
                <div>
                  <div className="text-xs text-base-content/60">Most Stars</div>
                  <div className="font-semibold">{stats.maxStarsDay.stars.toLocaleString()}</div>
                </div>
                <div className="text-xs text-base-content/50">
                  {new Date(stats.maxStarsDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Pattern */}
        {stats && (
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold text-base-content mb-4">Weekly Pattern</h3>
            <div className="space-y-2">
              {weekdays.map((day, index) => {
                const activity = stats.weekdayActivity[index];
                const maxActivity = Math.max(...stats.weekdayActivity);
                const percentage = maxActivity > 0 ? (activity / maxActivity) * 100 : 0;
                return (
                  <div key={day} className="flex items-center gap-3">
                    <div className="w-8 text-xs text-base-content/60">{day}</div>
                    <div className="flex-1 bg-base-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-xs text-right text-base-content/50">{activity.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Data Source Info */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-2 text-xs text-base-content/50">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Showing simulated GitHub activity data for the last {selectedPeriod} days. Connect to the GitHub API for real data.</span>
        </div>
      </div>
    </div>
  );
};

export default GitHubStatsPage;
