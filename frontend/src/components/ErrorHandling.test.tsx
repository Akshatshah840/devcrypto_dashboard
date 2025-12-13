import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import { ToastProvider, useToast } from './Toast';
import { DataSourceIndicator } from './DataSourceIndicator';

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Test component that uses toast
const ToastTester: React.FC = () => {
  const { addToast } = useToast();
  
  return (
    <button 
      onClick={() => addToast({ type: 'success', title: 'Test Toast' })}
    >
      Show Toast
    </button>
  );
};

describe('Error Handling Components', () => {
  describe('ErrorBoundary', () => {
    // Suppress console.error for these tests
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalError;
    });

    it('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('renders error UI when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('renders custom fallback when provided', () => {
      const customFallback = <div>Custom Error UI</div>;
      
      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    });
  });

  describe('Toast System', () => {
    it('renders toast when triggered', () => {
      render(
        <ToastProvider>
          <ToastTester />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Show Toast'));
      expect(screen.getByText('Test Toast')).toBeInTheDocument();
    });
  });

  describe('DataSourceIndicator', () => {
    it('renders live data indicator', () => {
      render(<DataSourceIndicator source="live" />);
      expect(screen.getByText('Live Data')).toBeInTheDocument();
    });

    it('renders mock data indicator', () => {
      render(<DataSourceIndicator source="mock" />);
      expect(screen.getByText('Simulated Data')).toBeInTheDocument();
    });

    it('renders offline indicator when not online', () => {
      render(<DataSourceIndicator source="live" isOnline={false} />);
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });
});