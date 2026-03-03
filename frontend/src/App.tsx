import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import GlobalLoader from "@/components/shared/GlobalLoader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import RoleRoute from "@/components/shared/RoleRoute";
import { Toaster } from "sonner";
import OAuthCallback from "@/pages/OAuthCallback";
import CandidateDashboard from "@/pages/candidate/Dashboard";



const Landing = lazy(() => import("@/pages/Landing"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Candidate pages
const CandidateProfile = lazy(() => import("@/pages/candidate/Profile"));
const CandidateResume = lazy(() => import("@/pages/candidate/Resume"));
const BrowseJobs = lazy(() => import("@/pages/candidate/BrowseJobs"));
const JobDetail = lazy(() => import("@/pages/candidate/JobDetail"));
const MyApplications = lazy(() => import("@/pages/candidate/MyApplications"));
const Recommendations = lazy(() => import("@/pages/candidate/Recommendations"));

// Recruiter pages
const RecruiterDashboard = lazy(() => import("@/pages/recruiter/Dashboard"));
const PostJob = lazy(() => import("@/pages/recruiter/PostJob"));
const EditJob = lazy(() => import("@/pages/recruiter/EditJob"));
const MyJobs = lazy(() => import("@/pages/recruiter/MyJobs"));
const JobApplications = lazy(() => import("@/pages/recruiter/JobApplications"));
const CandidateProfileView = lazy(() => import("@/pages/recruiter/CandidateProfile"));
const RankedCandidates = lazy(() => import("@/pages/recruiter/RankedCandidates"));

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics"));
const AdminSystemHealth = lazy(() => import("@/pages/admin/SystemHealth"));

// SUSPENSE FALLBACK
function PageLoader() {
  return <LoadingSpinner fullScreen text="Loading page..." />;
}

// APP COMPONENT
export default function App() {
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    // Simulate initial resource loading
    const timer = setTimeout(() => setAppLoading(false), 1500);
    
    // Preconnect to API
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = apiUrl;
    document.head.appendChild(link);
    
    return () => {
      clearTimeout(timer);
      document.head.removeChild(link);
    };
  }, []);

  return (
    <ErrorBoundary>
      {/* Global loading screen */}
      <GlobalLoader isLoading={appLoading} />

      {!appLoading && (
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />

              {/* Jobs browsing is public */}
              <Route path="/jobs" element={<BrowseJobs />} />
              <Route path="/jobs/:id" element={<JobDetail />} />

              {/* Candidate Routes */}
              <Route
                path="/candidate/dashboard"
                element={
                  <RoleRoute allowedRoles={["candidate"]}>
                    <CandidateDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/candidate/profile"
                element={
                  <RoleRoute allowedRoles={["candidate"]}>
                    <CandidateProfile />
                  </RoleRoute>
                }
              />
              <Route
                path="/candidate/resume"
                element={
                  <RoleRoute allowedRoles={["candidate"]}>
                    <CandidateResume />
                  </RoleRoute>
                }
              />
              <Route
                path="/candidate/applications"
                element={
                  <RoleRoute allowedRoles={["candidate"]}>
                    <MyApplications />
                  </RoleRoute>
                }
              />
              <Route
                path="/candidate/recommendations"
                element={
                  <RoleRoute allowedRoles={["candidate"]}>
                    <Recommendations />
                  </RoleRoute>
                }
              />

              {/* Recruiter Routes */}
              <Route
                path="/recruiter/dashboard"
                element={
                  <RoleRoute allowedRoles={["recruiter"]}>
                    <RecruiterDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/recruiter/post-job"
                element={
                  <RoleRoute allowedRoles={["recruiter"]}>
                    <PostJob />
                  </RoleRoute>
                }
              />
              <Route
                path="/recruiter/my-jobs"
                element={
                  <RoleRoute allowedRoles={["recruiter"]}>
                    <MyJobs />
                  </RoleRoute>
                }
              />
              <Route
                path="/recruiter/edit-job/:jobId"
                element={
                  <RoleRoute allowedRoles={["recruiter"]}>
                    <EditJob />
                  </RoleRoute>
                }
              />
              <Route
                path="/recruiter/jobs/:jobId/applications"
                element={
                  <RoleRoute allowedRoles={["recruiter"]}>
                    <JobApplications />
                  </RoleRoute>
                }
              />
              <Route
                path="/recruiter/jobs/:jobId/ranked"
                element={
                  <RoleRoute allowedRoles={["recruiter"]}>
                    <RankedCandidates />
                  </RoleRoute>
                }
              />
              <Route
                path="/recruiter/candidate/:candidateId"
                element={
                  <RoleRoute allowedRoles={["recruiter"]}>
                    <CandidateProfileView />
                  </RoleRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <RoleRoute allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <RoleRoute allowedRoles={["admin"]}>
                    <AdminUsers />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <RoleRoute allowedRoles={["admin"]}>
                    <AdminAnalytics />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/system-health"
                element={
                  <RoleRoute allowedRoles={["admin"]}>
                    <AdminSystemHealth />
                  </RoleRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
              className: "font-sans",
            }}
          />
        </AuthProvider>
      )}
    </ErrorBoundary>
  );
}