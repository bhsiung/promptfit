/**
 * PromptFit — App Router
 * Design: Luminous Minimal — Apple Fitness+ inspired
 * Routes:
 *   /         → Landing page (public-facing)
 *   /compile  → JSON Compiler (developer/GPT tool)
 *   /play     → WorkoutPlayer (via ?id=<planId>)
 *   /library  → Exercise Library
 *   /about    → About PromptFit
 *   /privacy  → Privacy Policy
 *   /terms    → Terms of Service
 *   /404      → Not Found
 */
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/NotFound';
import { Route, Switch } from 'wouter';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import Landing from './pages/Landing';
import Home from './pages/Home';
import WorkoutPlayer from './pages/WorkoutPlayer';
import Library from './pages/Library';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

function Router() {
  // Check if #data= hash, ?data= query, or ?id= query is present to decide which page to show at /compile
  const hasData = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.hash.slice(1)).has('data') ||
    new URLSearchParams(window.location.search).has('data') ||
    new URLSearchParams(window.location.search).has('id')
  );

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/compile" component={hasData ? WorkoutPlayer : Home} />
      <Route path="/play" component={WorkoutPlayer} />
      <Route path="/workout" component={WorkoutPlayer} />
      <Route path="/library" component={Library} />
      <Route path="/about" component={About} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
