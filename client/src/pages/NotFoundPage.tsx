import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="not-found">
      <div className="panel not-found-panel">
        <h2>Page not found</h2>
        <p>The requested route does not exist.</p>
        <Link className="primary-button" to="/dashboard">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

