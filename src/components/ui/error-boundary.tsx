import type { ErrorInfo, ReactNode } from 'react';
import type { ErrorReporterProvider } from '@/core/error-reporter';
import * as React from 'react';
import { View } from 'react-native';
import { Button } from './button';
import { Card } from './card';
import { Text } from './text';

export type ErrorBoundaryProps = {
  readonly children: ReactNode;
  readonly reporter?: ErrorReporterProvider;
  readonly fallbackTitle?: string;
  readonly onReset?: () => void;
};

type ErrorBoundaryState = {
  readonly error: Error | null;
};

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    const { reporter } = this.props;
    if (reporter) {
      void reporter.captureException(error, {
        componentStack: info.componentStack,
      });
    }
  }

  private readonly handleReset = (): void => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  public override render(): ReactNode {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    const title = this.props.fallbackTitle ?? 'Something went wrong';

    return (
      <View testID="error-boundary-fallback" className="flex-1 justify-center p-6">
        <Card className="gap-3">
          <Text className="font-semibold text-lg text-foreground">
            {title}
          </Text>
          <Text testID="error-boundary-message" className="text-sm text-muted-foreground">
            {error.message}
          </Text>
          <Button
            testID="error-boundary-retry-button"
            label="Try again"
            onPress={this.handleReset}
          />
        </Card>
      </View>
    );
  }
}
