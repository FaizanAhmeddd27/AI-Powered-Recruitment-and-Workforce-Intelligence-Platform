import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import GlobalLoader from "@/components/shared/GlobalLoader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import RoleRoute from "@/components/shared/RoleRoute";


const Landing = lazy(() => import("@/pages/Landing"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const OAuthCallback = lazy(() => import("@/pages/OAuthCallback"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const CandidateDashboard = lazy(() => import("@/pages/candidate/Dashboard"));
const CandidateProfile = lazy(() => import("@/pages/candidate/Profile"));
const CandidateResume = lazy(() => import("@/pages/candidate/Resume"));
const BrowseJobs = lazy(() => import("@/pages/candidate/BrowseJobs"));
const JobDetail = lazy(() => import("@/pages/candidate/JobDetail"));
const MyApplications = lazy(() => import("@/pages/candidate/MyApplications"));
const Recommendations = lazy(() => import("@/pages/candidate/Recommendations"));

const RecruiterDashboard = lazy(() => import("@/pages/recruiter/Dashboard"));
const PostJob = lazy(() => import("@/pages/recruiter/PostJob"));
const MyJobs = lazy(() => import("@/pages/recruiter/MyJobs"));
const JobApplications = lazy(() => import("@/pages/recruiter/JobApplications"));
const CandidateProfileView = lazy(() => import("@/pages/recruiter/CandidateProfile"));
const RankedCandidates = lazy(() => import("@/pages/recruiter/RankedCandidates"));

const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics"));
const AdminSystemHealth = lazy(() => import("@/pages/admin/SystemHealth"));


function PageLoader() {
  return <LoadingSpinner fullScreen text="Loading page..." />;
}

export default function App() {
  const [appLoading, setAppLoading] = useState(() => {
    // Skip loading if user is already authenticated
    return !localStorage.getItem("accessToken");
  });

  useEffect(() => {
    if (appLoading) {
      // Only show brief loading for first-time visitors
      const timer = setTimeout(() => setAppLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [appLoading]);

  return (
    <ErrorBoundary>
      {/* Global loading screen */}
      <GlobalLoader isLoading={appLoading} />

      {!appLoading && (
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />

              <Route path="/jobs" element={<BrowseJobs />} />
              <Route path="/jobs/:id" element={<JobDetail />} />

   
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

         
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      )}
    </ErrorBoundary>
  );
}