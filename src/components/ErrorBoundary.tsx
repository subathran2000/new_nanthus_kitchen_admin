import { Component, ErrorInfo, ReactNode } from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import { ErrorOutline as ErrorIcon, Refresh as RefreshIcon } from "@mui/icons-material";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch JavaScript errors in child components.
 * Displays a fallback UI instead of crashing the entire application.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }
    
    // TODO: Log to error tracking service (e.g., Sentry) in production
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            background:
              "linear-gradient(135deg, #0B1120 0%, #0F172A 50%, #1A2942 100%)",
            p: 3,
          }}
        >
          <Paper
            sx={{
              maxWidth: 500,
              width: "100%",
              p: 4,
              textAlign: "center",
              background: "rgba(15, 23, 42, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 3,
            }}
          >
            <ErrorIcon
              sx={{
                fontSize: 64,
                color: "#ef4444",
                mb: 2,
              }}
            />
            <Typography
              variant="h5"
              sx={{
                color: "#F8FAFC",
                fontWeight: 600,
                mb: 1,
              }}
            >
              Something went wrong
            </Typography>
            <Typography
              sx={{
                color: "#94A3B8",
                mb: 3,
              }}
            >
              An unexpected error occurred. Please try again or refresh the page.
            </Typography>
            
            {import.meta.env.DEV && this.state.error && (
              <Paper
                sx={{
                  p: 2,
                  mb: 3,
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: 2,
                  textAlign: "left",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "#ef4444",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {"\n\nComponent Stack:"}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </Typography>
              </Paper>
            )}

            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Button
                variant="outlined"
                onClick={this.handleReset}
                sx={{
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: "#F8FAFC",
                  "&:hover": {
                    borderColor: "#F7921E",
                    background: "rgba(247, 146, 30, 0.1)",
                  },
                }}
              >
                Try Again
              </Button>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
                sx={{
                  background: "linear-gradient(135deg, #F7921E 0%, #e07b0c 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #e07b0c 0%, #c96a0a 100%)",
                  },
                }}
              >
                Refresh Page
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
