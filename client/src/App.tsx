import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Assessment from "@/pages/assessment";
import AssessmentSummaryPage from "@/pages/assessment-summary";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin-page";
import Dashboard from "@/pages/dashboard";
import { AssessmentProvider } from "@/context/AssessmentContext";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <ProtectedRoute path="/dashboard">
        <Home />
      </ProtectedRoute>
      <ProtectedRoute path="/assessment">
        <Assessment />
      </ProtectedRoute>
      <ProtectedRoute path="/assessment/:id">
        <Assessment />
      </ProtectedRoute>
      <ProtectedRoute path="/assessment-summary/:id">
        <AssessmentSummaryPage />
      </ProtectedRoute>
      {/* Admin routes with role requirement */}
      <ProtectedRoute path="/admin" requiredRole="admin">
        <AdminPage />
      </ProtectedRoute>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AssessmentProvider>
          <Router />
          <Toaster />
        </AssessmentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
