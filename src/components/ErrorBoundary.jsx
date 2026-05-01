import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-container" style={{ textAlign: "center", paddingTop: 64 }}>
          <div className="card">
            <h3>Something went wrong</h3>
            <p className="page-subtitle" style={{ marginTop: 8 }}>
              This page encountered an error. Try refreshing, or go back to the Dashboard.
            </p>
            <button
              className="btn"
              style={{ marginTop: 20 }}
              onClick={() => this.setState({ hasError: false })}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
