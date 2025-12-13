n# Implementation Plan

- [x] 1. Set up project structure and development environment
  - Create monorepo structure with frontend and backend directories
  - Initialize React + Vite frontend with TypeScript configuration
  - Initialize Node.js + Express backend with TypeScript configuration
  - Configure Tailwind CSS + DaisyUI for styling
  - Set up development scripts for concurrent frontend/backend development
  - _Requirements: 8.1, 8.2_

- [x] 1.1 Set up testing frameworks
  - Configure Jest + React Testing Library for frontend unit tests
  - Configure Jest + Supertest for backend API tests
  - Install and configure fast-check for property-based testing
  - _Requirements: All testing requirements_

- [x] 2. Implement core data models and types
  - Create TypeScript interfaces for GitHubActivity, AirQualityData, CorrelationResult
  - Define TechHubCity interface with predefined city data
  - Implement data validation functions for all models
  - Create utility types for API responses and internal data structures
  - _Requirements: 7.1, 7.2, 7.4_

- [x] 2.1 Write property test for data model round-trip serialization
  - **Property 13: API response parsing round-trip**
  - **Validates: Requirements 7.1, 7.2, 7.5**

- [x] 2.2 Write property test for export serialization round-trip
  - **Property 14: Export serialization round-trip**
  - **Validates: Requirements 7.3**

- [x] 3. Create backend API infrastructure
  - Set up Express server with CORS and rate limiting middleware
  - Implement health check endpoint (/api/health)
  - Create error handling middleware for consistent error responses
  - Set up request logging and validation middleware
  - _Requirements: 8.1, 8.5_

- [x] 3.1 Implement cities endpoint
  - Create /api/cities endpoint returning predefined tech hub cities
  - Include city metadata (coordinates, timezone, GitHub search queries)
  - _Requirements: 4.1_

- [x] 3.2 Write unit tests for cities endpoint
  - Test cities endpoint returns correct city data
  - Validate city data structure and required fields
  - _Requirements: 4.1_

- [x] 4. Implement external API integration layer
  - Create GitHub API client with rate limiting and error handling
  - Create WAQI API client with rate limiting and error handling
  - Implement exponential backoff retry logic for both APIs
  - Add request/response logging for debugging
  - _Requirements: 1.1, 2.1, 6.1, 6.3_

- [x] 4.1 Implement mock data generators
  - Create realistic GitHub activity data generator
  - Create realistic air quality data generator
  - Implement fallback logic when APIs are unavailable
  - _Requirements: 1.3, 2.3, 6.1_

- [x] 4.2 Write property test for city-based data fetching
  - **Property 1: City-based data fetching**
  - **Validates: Requirements 1.1, 2.1**

- [x] 4.3 Write property test for mock data indication
  - **Property 12: Mock data indication**
  - **Validates: Requirements 6.2**

- [x] 5. Implement GitHub data endpoints
  - Create /api/github/:city/:days endpoint
  - Implement GitHub API data fetching and aggregation
  - Add caching layer for API responses
  - Handle rate limiting with automatic fallback to mock data
  - _Requirements: 1.1, 1.4, 1.5_

- [x] 5.1 Write property test for GitHub statistics breakdown
  - **Property 4: GitHub statistics breakdown**
  - **Validates: Requirements 1.5**

- [x] 5.2 Write property test for time period filtering
  - **Property 3: Time period filtering**
  - **Validates: Requirements 1.4, 2.4**

- [x] 6. Implement air quality data endpoints
  - Create /api/airquality/:city/:days endpoint
  - Implement WAQI API data fetching and processing
  - Add data validation for AQI and PM2.5 values
  - Handle API errors with fallback to mock data
  - _Requirements: 2.1, 2.4, 2.5_

- [x] 6.1 Write property test for air quality threshold warnings
  - **Property 5: Air quality threshold warnings**
  - **Validates: Requirements 2.5**

- [x] 7. Implement correlation analysis system
  - Create correlation calculation utilities using statistical formulas
  - Implement /api/correlation/:city/:days endpoint
  - Add confidence interval calculations for correlation results
  - Handle edge cases (insufficient data, identical values)
  - _Requirements: 3.1, 3.4_

- [x] 7.1 Write property test for correlation calculation accuracy
  - **Property 6: Correlation calculation accuracy**
  - **Validates: Requirements 3.1**

- [x] 7.2 Write property test for correlation significance highlighting
  - **Property 7: Correlation significance highlighting**
  - **Validates: Requirements 3.4**

- [x] 8. Implement data export functionality
  - Create /api/export/:format/:city/:days endpoint
  - Implement JSON and CSV export formats
  - Add proper filename generation with timestamps
  - Include metadata in exports (data sources, generation time)
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 8.1 Write property test for export data completeness
  - **Property 10: Export data completeness and integrity**
  - **Validates: Requirements 5.2, 5.3**

- [x] 8.2 Write property test for export filename generation
  - **Property 11: Export filename generation**
  - **Validates: Requirements 5.5**

- [x] 8.3 Write property test for correlation data export
  - **Property 8: Correlation data export**
  - **Validates: Requirements 3.5**

- [x] 9. Checkpoint - Ensure backend API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Create frontend application structure
  - Set up React app with TypeScript and routing
  - Create main App component with theme provider
  - Implement responsive layout with sidebar and header
  - Configure DaisyUI theme system with 32 theme options
  - _Requirements: 4.4, 4.5_

- [x] 10.1 Implement core layout components
  - Create collapsible Sidebar component with navigation
  - Create Header component with theme switcher
  - Implement TabNavigation component for main content areas
  - Add responsive design for mobile and desktop
  - _Requirements: 4.3, 4.4, 4.5_

- [x] 11. Implement data fetching and state management
  - Create custom hooks for API data fetching
  - Implement loading states and error handling
  - Add data caching to prevent unnecessary API calls
  - Create context providers for shared state
  - _Requirements: 6.2, 6.4_

- [x] 11.1 Create city and time period selectors
  - Implement CitySelector dropdown component
  - Create TimePeriodSelector button group component
  - Add state synchronization between selectors
  - _Requirements: 4.1, 4.2_

- [x] 11.2 Write property test for UI state synchronization
  - **Property 9: UI state synchronization**
  - **Validates: Requirements 4.2**

- [x] 12. Implement data visualization components
  - Create GitHubActivityChart component using Recharts
  - Create AirQualityChart component with time series visualization
  - Implement CorrelationChart component with scatter plots and trend lines
  - Add interactive features (tooltips, zoom, pan)
  - _Requirements: 1.2, 2.2, 3.2, 3.3_

- [x] 12.1 Write property test for data visualization rendering
  - **Property 2: Data visualization rendering**
  - **Validates: Requirements 1.2, 2.2, 3.2, 3.3**

- [x] 13. Create main dashboard pages
  - Implement Dashboard page with overview metrics and mini-charts
  - Create CitiesPage with detailed city-specific views
  - Build GitHubStatsPage with comprehensive GitHub analysis
  - Develop AirQualityPage with detailed pollution analysis
  - _Requirements: 4.3_

- [x] 14. Implement comparison and correlation features
  - Create ComparisonPage with side-by-side data views
  - Implement correlation analysis visualization
  - Add statistical significance indicators
  - Create interactive correlation exploration tools
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 15. Build reports and export functionality
  - Create ReportsPage with export controls
  - Implement client-side export triggering
  - Add export progress indicators and download handling
  - Create export history and management features
  - _Requirements: 5.1, 5.2, 5.5_

- [x] 15.1 Write property test for data transformation consistency
  - **Property 15: Data transformation consistency**
  - **Validates: Requirements 7.4, 8.3, 8.5**

- [x] 16. Implement error handling and user feedback
  - Add error boundaries for component crash handling
  - Implement toast notifications for user feedback
  - Create loading skeletons for better UX
  - Add offline mode indicators and cached data display
  - _Requirements: 6.2, 6.4, 6.5_

- [x] 17. Add responsive design and accessibility
  - Ensure all components work on mobile and desktop
  - Add keyboard navigation support
  - Implement ARIA labels and semantic HTML
  - Test with screen readers and accessibility tools
  - _Requirements: 4.5_

- [x] 17.1 Write integration tests for key user workflows
  - Test complete data fetching and visualization workflow
  - Test export functionality end-to-end
  - Test theme switching and responsive behavior
  - _Requirements: All UI requirements_

- [x] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.