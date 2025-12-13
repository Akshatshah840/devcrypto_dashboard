/**
 * Property-based tests for GitHub Statistics Breakdown
 * **Feature: github-air-quality-dashboard, Property 4: GitHub statistics breakdown**
 */

import * as fc from 'fast-check';
import { GitHubActivity } from '../types';
import { dataService } from './dataService';
import { TECH_HUB_CITIES } from '../data/cities';

describe('GitHub Statistics Breakdown Property Tests', () => {
  beforeEach(() => {
    // Force mock data for consistent testing
    process.env.FORCE_MOCK_DATA = 'true';
  });

  afterEach(() => {
    delete process.env.FORCE_MOCK_DATA;
  });

  /**
   * **Feature: github-air-quality-dashboard, Property 4: GitHub statistics breakdown**
   * **Validates: Requirements 1.5**
   * 
   * For any GitHub activity data, the system should provide accurate detailed 
   * breakdowns by repository activity and developer contributions
   */
  test('Property 4: GitHub statistics breakdown', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random city from available tech hub cities
        fc.constantFrom(...TECH_HUB_CITIES.map(city => city.id)),
        // Generate random time period from allowed values
        fc.constantFrom(7, 14, 30, 60, 90),
        async (cityId: string, days: number) => {
          // Fetch GitHub data
          const result = await dataService.getGitHubData(cityId, days);
          const githubData = result.data;
          
          // Verify we have data for the breakdown
          expect(githubData).toBeDefined();
          expect(Array.isArray(githubData)).toBe(true);
          expect(githubData.length).toBe(days);
          
          // Calculate detailed breakdowns from the data
          const breakdown = calculateGitHubStatisticsBreakdown(githubData);
          
          // Verify repository activity breakdown
          expect(breakdown.repositoryActivity).toBeDefined();
          expect(breakdown.repositoryActivity.totalRepositories).toBeGreaterThanOrEqual(0);
          expect(breakdown.repositoryActivity.averageRepositoriesPerDay).toBeGreaterThanOrEqual(0);
          expect(breakdown.repositoryActivity.peakRepositoryDay).toBeDefined();
          expect(breakdown.repositoryActivity.repositoryTrend).toBeDefined();
          
          // Verify developer contributions breakdown
          expect(breakdown.developerContributions).toBeDefined();
          expect(breakdown.developerContributions.totalCommits).toBeGreaterThanOrEqual(0);
          expect(breakdown.developerContributions.totalStars).toBeGreaterThanOrEqual(0);
          expect(breakdown.developerContributions.totalContributors).toBeGreaterThanOrEqual(0);
          expect(breakdown.developerContributions.averageCommitsPerDay).toBeGreaterThanOrEqual(0);
          expect(breakdown.developerContributions.averageStarsPerDay).toBeGreaterThanOrEqual(0);
          expect(breakdown.developerContributions.averageContributorsPerDay).toBeGreaterThanOrEqual(0);
          
          // Verify breakdown accuracy - totals should match sum of individual data points
          const expectedTotalCommits = githubData.reduce((sum, day) => sum + day.commits, 0);
          const expectedTotalStars = githubData.reduce((sum, day) => sum + day.stars, 0);
          const expectedTotalRepositories = githubData.reduce((sum, day) => sum + day.repositories, 0);
          const expectedTotalContributors = githubData.reduce((sum, day) => sum + day.contributors, 0);
          
          expect(breakdown.developerContributions.totalCommits).toBe(expectedTotalCommits);
          expect(breakdown.developerContributions.totalStars).toBe(expectedTotalStars);
          expect(breakdown.repositoryActivity.totalRepositories).toBe(expectedTotalRepositories);
          expect(breakdown.developerContributions.totalContributors).toBe(expectedTotalContributors);
          
          // Verify averages are calculated correctly
          const expectedAvgCommits = expectedTotalCommits / days;
          const expectedAvgStars = expectedTotalStars / days;
          const expectedAvgRepos = expectedTotalRepositories / days;
          const expectedAvgContributors = expectedTotalContributors / days;
          
          expect(breakdown.developerContributions.averageCommitsPerDay).toBeCloseTo(expectedAvgCommits, 2);
          expect(breakdown.developerContributions.averageStarsPerDay).toBeCloseTo(expectedAvgStars, 2);
          expect(breakdown.repositoryActivity.averageRepositoriesPerDay).toBeCloseTo(expectedAvgRepos, 2);
          expect(breakdown.developerContributions.averageContributorsPerDay).toBeCloseTo(expectedAvgContributors, 2);
          
          // Verify peak day identification
          const maxRepoDay = githubData.reduce((max, day) => 
            day.repositories > max.repositories ? day : max
          );
          expect(breakdown.repositoryActivity.peakRepositoryDay.date).toBe(maxRepoDay.date);
          expect(breakdown.repositoryActivity.peakRepositoryDay.repositories).toBe(maxRepoDay.repositories);
          
          // Verify trend calculation (should be 'increasing', 'decreasing', or 'stable')
          expect(['increasing', 'decreasing', 'stable']).toContain(breakdown.repositoryActivity.repositoryTrend);
          
          // Verify breakdown provides meaningful insights
          expect(breakdown.insights).toBeDefined();
          expect(Array.isArray(breakdown.insights)).toBe(true);
          expect(breakdown.insights.length).toBeGreaterThan(0);
          
          // Each insight should be a non-empty string
          breakdown.insights.forEach(insight => {
            expect(typeof insight).toBe('string');
            expect(insight.length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 100, timeout: 30000 }
    );
  });

  test('should handle edge cases in breakdown calculation', () => {
    // Test with empty data
    const emptyBreakdown = calculateGitHubStatisticsBreakdown([]);
    expect(emptyBreakdown.repositoryActivity.totalRepositories).toBe(0);
    expect(emptyBreakdown.developerContributions.totalCommits).toBe(0);
    expect(emptyBreakdown.repositoryActivity.averageRepositoriesPerDay).toBe(0);
    expect(emptyBreakdown.insights).toContain('No GitHub activity data available for analysis');
    
    // Test with single data point
    const singleDayData: GitHubActivity[] = [{
      date: '2023-12-01',
      city: 'san-francisco',
      commits: 100,
      stars: 50,
      repositories: 10,
      contributors: 25
    }];
    
    const singleBreakdown = calculateGitHubStatisticsBreakdown(singleDayData);
    expect(singleBreakdown.repositoryActivity.totalRepositories).toBe(10);
    expect(singleBreakdown.developerContributions.totalCommits).toBe(100);
    expect(singleBreakdown.repositoryActivity.averageRepositoriesPerDay).toBe(10);
    expect(singleBreakdown.repositoryActivity.repositoryTrend).toBe('stable');
  });
});

/**
 * Calculate detailed GitHub statistics breakdown from activity data
 */
function calculateGitHubStatisticsBreakdown(data: GitHubActivity[]) {
  if (data.length === 0) {
    return {
      repositoryActivity: {
        totalRepositories: 0,
        averageRepositoriesPerDay: 0,
        peakRepositoryDay: { date: '', repositories: 0 },
        repositoryTrend: 'stable' as const
      },
      developerContributions: {
        totalCommits: 0,
        totalStars: 0,
        totalContributors: 0,
        averageCommitsPerDay: 0,
        averageStarsPerDay: 0,
        averageContributorsPerDay: 0
      },
      insights: ['No GitHub activity data available for analysis']
    };
  }

  // Calculate repository activity breakdown
  const totalRepositories = data.reduce((sum, day) => sum + day.repositories, 0);
  const averageRepositoriesPerDay = totalRepositories / data.length;
  const peakRepositoryDay = data.reduce((max, day) => 
    day.repositories > max.repositories ? day : max
  );
  
  // Calculate repository trend
  let repositoryTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (data.length > 1) {
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.repositories, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.repositories, 0) / secondHalf.length;
    
    const trendThreshold = 0.1; // 10% change threshold
    const percentChange = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;
    
    if (percentChange > trendThreshold) {
      repositoryTrend = 'increasing';
    } else if (percentChange < -trendThreshold) {
      repositoryTrend = 'decreasing';
    }
  }

  // Calculate developer contributions breakdown
  const totalCommits = data.reduce((sum, day) => sum + day.commits, 0);
  const totalStars = data.reduce((sum, day) => sum + day.stars, 0);
  const totalContributors = data.reduce((sum, day) => sum + day.contributors, 0);
  
  const averageCommitsPerDay = totalCommits / data.length;
  const averageStarsPerDay = totalStars / data.length;
  const averageContributorsPerDay = totalContributors / data.length;

  // Generate insights
  const insights: string[] = [];
  
  if (totalRepositories > 0) {
    insights.push(`Total of ${totalRepositories} repositories tracked across ${data.length} days`);
  }
  
  if (averageCommitsPerDay > 100) {
    insights.push('High commit activity detected - very active development period');
  } else if (averageCommitsPerDay < 50) {
    insights.push('Low commit activity - possible quiet development period');
  }
  
  if (repositoryTrend === 'increasing') {
    insights.push('Repository creation trend is increasing over the time period');
  } else if (repositoryTrend === 'decreasing') {
    insights.push('Repository creation trend is decreasing over the time period');
  }
  
  const commitsPerRepo = totalRepositories > 0 ? totalCommits / totalRepositories : 0;
  if (commitsPerRepo > 50) {
    insights.push('High commits per repository ratio indicates intensive development');
  }

  return {
    repositoryActivity: {
      totalRepositories,
      averageRepositoriesPerDay,
      peakRepositoryDay: {
        date: peakRepositoryDay.date,
        repositories: peakRepositoryDay.repositories
      },
      repositoryTrend
    },
    developerContributions: {
      totalCommits,
      totalStars,
      totalContributors,
      averageCommitsPerDay,
      averageStarsPerDay,
      averageContributorsPerDay
    },
    insights
  };
}