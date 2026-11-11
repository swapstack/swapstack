import { fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { MockErrorReporterProvider } from '@/core';
import { ErrorBoundary } from './error-boundary';
import { Text } from './text';

function ThrowingWidget({ shouldThrow }: { readonly shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Widget exploded');
  }
  return <Text testID="healthy-widget">Widget OK</Text>;
}

describe('errorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('catches render errors, reports them to ErrorReporterProvider, and recovers on retry', () => {
    const reporter = new MockErrorReporterProvider();
    let shouldThrow = true;

    const { rerender } = render(
      <ErrorBoundary
        reporter={reporter}
        onReset={() => {
          shouldThrow = false;
        }}
      >
        <ThrowingWidget shouldThrow={shouldThrow} />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('error-boundary-fallback')).toBeTruthy();
    expect(screen.getByTestId('error-boundary-message').props.children).toBe('Widget exploded');
    expect(reporter.getReports()).toHaveLength(1);
    expect(reporter.getReports()[0]?.message).toBe('Widget exploded');

    shouldThrow = false;
    rerender(
      <ErrorBoundary reporter={reporter}>
        <ThrowingWidget shouldThrow={shouldThrow} />
      </ErrorBoundary>,
    );

    fireEvent.press(screen.getByTestId('error-boundary-retry-button'));
    expect(screen.getByTestId('healthy-widget')).toBeTruthy();
  });
});
