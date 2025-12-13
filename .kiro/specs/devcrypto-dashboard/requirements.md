# Requirements Document

## Introduction

The DevCrypto Analytics Dashboard is a data analytics application that explores correlations between GitHub developer activity and cryptocurrency price movements. The system fetches real-time crypto data from CoinGecko API and GitHub activity metrics to provide interactive visualizations and statistical analysis.

## Glossary

- **Dashboard_System**: The complete web application including frontend and backend components
- **GitHub_API**: GitHub's REST API for retrieving repository and developer activity data
- **CoinGecko_API**: CoinGecko's API (api.coingecko.com) for retrieving cryptocurrency price data
- **Crypto_Coin**: One of the supported cryptocurrencies (Bitcoin, Ethereum, Solana, Cardano, Dogecoin, XRP, Polkadot, Avalanche)
- **Correlation_Analysis**: Statistical calculation measuring the relationship between GitHub activity and crypto price movements
- **AWS_Cognito**: Amazon Cognito for user authentication
- **AWS_Lambda**: Serverless compute service for backend API

## Requirements

### Requirement 1

**User Story:** As a data analyst, I want to view GitHub activity metrics for cryptocurrency projects, so that I can analyze developer productivity patterns.

#### Acceptance Criteria

1. WHEN a user selects a cryptocurrency, THE Dashboard_System SHALL fetch GitHub data including commits, stars, and repository counts for related projects
2. WHEN GitHub data is retrieved, THE Dashboard_System SHALL display the metrics in interactive charts using Recharts library
3. WHEN displaying GitHub metrics, THE Dashboard_System SHALL show data for the selected time period (7, 14, 30, 60, or 90 days)

### Requirement 2

**User Story:** As a crypto trader, I want to view cryptocurrency price data, so that I can understand market movements.

#### Acceptance Criteria

1. WHEN a user selects a cryptocurrency, THE Dashboard_System SHALL fetch price data from CoinGecko API
2. WHEN price data is retrieved, THE Dashboard_System SHALL display the measurements in time-series charts
3. WHEN displaying crypto prices, THE Dashboard_System SHALL show historical data for the selected time period

### Requirement 3

**User Story:** As a researcher, I want to compare GitHub activity with crypto prices, so that I can identify potential correlations between developer activity and price movements.

#### Acceptance Criteria

1. WHEN both GitHub and price data are available, THE Dashboard_System SHALL calculate statistical correlation coefficients between the datasets
2. WHEN correlation analysis is complete, THE Dashboard_System SHALL display the results with correlation strength indicators
3. WHEN generating correlation reports, THE Dashboard_System SHALL include data export functionality (JSON/CSV)

### Requirement 4

**User Story:** As a user, I want secure authentication, so that my dashboard preferences are saved.

#### Acceptance Criteria

1. WHEN a user accesses the dashboard, THE Dashboard_System SHALL require authentication via AWS Cognito
2. WHEN a user logs in, THE Dashboard_System SHALL display their name and email in the sidebar
3. WHEN using the interface, THE Dashboard_System SHALL provide a theme switcher with 32 DaisyUI theme options

### Requirement 5

**User Story:** As a data analyst, I want to export dashboard data, so that I can perform additional analysis.

#### Acceptance Criteria

1. WHEN a user requests data export, THE Dashboard_System SHALL provide options to export data in both JSON and CSV formats
2. WHEN exporting data, THE Dashboard_System SHALL include all currently displayed metrics
3. WHEN exports are generated, THE Dashboard_System SHALL include appropriate metadata
