import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { lazy, Suspense, ReactNode } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Eagerly loaded pages (critical path - needed immediately on first load)
import Home from "./pages/Home";
import Login from "./pages/Login";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";

// Lazily loaded pages (code splitting - loaded only when navigated to)
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Classes = lazy(() => import("./pages/Classes"));
const ClassDetail = lazy(() => import("./pages/ClassDetail"));
const Instructors = lazy(() => import("./pages/Instructors"));
const InstructorProfile = lazy(() => import("./pages/InstructorProfile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const CRMDashboard = lazy(() => import("./pages/CRMDashboard"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const AttendanceDashboard = lazy(() => import("./pages/AttendanceDashboard"));
const EmailMarketing = lazy(() => import("./pages/EmailMarketing"));
const CampaignDetail = lazy(() => import("./pages/CampaignDetail"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Earnings = lazy(() => import("./pages/Earnings"));
const AdminWithdrawals = lazy(() => import("./pages/AdminWithdrawals"));
const PromoterProfile = lazy(() => import("./pages/PromoterProfile"));
const Promoters = lazy(() => import("./pages/Promoters"));
const StaffScanner = lazy(() => import("./pages/StaffScanner"));
const BecomeInstructor = lazy(() => import("./pages/BecomeInstructor"));
const ImageCropperDemo = lazy(() => import("./components/ImageCropperDemo"));
const ImageCropperProDemo = lazy(() => import("./components/ImageCropperProDemo"));
const ReservationConfirmation = lazy(() => import("./pages/ReservationConfirmation"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const BecomeRrp = lazy(() => import("./pages/BecomeRrp"));
const RrpDashboard = lazy(() => import("./pages/RrpDashboard"));

// Loading fallback - Discrete top progress bar (non-blocking)
function PageLoader() {
  return (
    <div className="fixed top-0 inset-x-0 z-50">
      {/* Animated gradient progress bar */}
      <div className="h-1 bg-gradient-to-r from-[#FA3698] via-[#FD4D43] to-[#FFD700] animate-pulse">
        <div className="h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      </div>
      {/* Optional: Subtle backdrop blur at top only */}
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
    </div>
  );
}

/** Roles que pueden acceder al panel admin/creator */
const CREATOR_ROLES = ["admin", "instructor", "promoter"];

/** Wrapper to easily add error boundaries to routes */
function SafeRoute({ children, name }: { children: ReactNode; name?: string }) {
  return <RouteErrorBoundary routeName={name}>{children}</RouteErrorBoundary>;
}

function Router() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          {/* ── Rutas públicas ─────────────────────────────────── */}
          <Route path="/">
            <SafeRoute name="Home"><Home /></SafeRoute>
          </Route>
          <Route path="/events">
            <SafeRoute name="Events"><Events /></SafeRoute>
          </Route>
          <Route path="/events/:id">
            <SafeRoute name="Event Details"><EventDetail /></SafeRoute>
          </Route>
          <Route path="/courses">
            <SafeRoute name="Courses"><Courses /></SafeRoute>
          </Route>
          <Route path="/courses/:id">
            <SafeRoute name="Course Details"><CourseDetail /></SafeRoute>
          </Route>
          <Route path="/classes">
            <SafeRoute name="Classes"><Classes /></SafeRoute>
          </Route>
          <Route path="/classes/:id">
            <SafeRoute name="Class Details"><ClassDetail /></SafeRoute>
          </Route>
          <Route path="/instructors">
            <SafeRoute name="Instructors"><Instructors /></SafeRoute>
          </Route>
          <Route path="/instructors/:id">
            <SafeRoute name="Instructor Profile"><InstructorProfile /></SafeRoute>
          </Route>
          <Route path="/promoters">
            <SafeRoute name="Promoters"><Promoters /></SafeRoute>
          </Route>
          <Route path="/promoters/:id">
            <SafeRoute name="Promoter Profile"><PromoterProfile /></SafeRoute>
          </Route>
          <Route path="/pricing">
            <SafeRoute name="Pricing"><Pricing /></SafeRoute>
          </Route>
          <Route path="/image-cropper-demo">
            <SafeRoute name="Image Cropper"><ImageCropperDemo /></SafeRoute>
          </Route>
          <Route path="/image-cropper-pro">
            <SafeRoute name="Image Cropper Pro"><ImageCropperProDemo /></SafeRoute>
          </Route>
          <Route path="/login">
            <SafeRoute name="Login"><Login /></SafeRoute>
          </Route>
          <Route path="/forgot-password">
            <SafeRoute name="Forgot Password"><ForgotPassword /></SafeRoute>
          </Route>
          <Route path="/reset-password">
            <SafeRoute name="Reset Password"><ResetPassword /></SafeRoute>
          </Route>
          <Route path="/become-rrp">
            <SafeRoute name="Become RRP"><BecomeRrp /></SafeRoute>
          </Route>
          <Route path="/rrp-dashboard">
            <SafeRoute name="RRP Dashboard">
              <ProtectedRoute>
                <RrpDashboard />
              </ProtectedRoute>
            </SafeRoute>
          </Route>
          <Route path="/terms">
            <SafeRoute name="Terms of Service"><TermsOfService /></SafeRoute>
          </Route>
          <Route path="/privacy">
            <SafeRoute name="Privacy Policy"><PrivacyPolicy /></SafeRoute>
          </Route>
          <Route path="/payment-success">
            <SafeRoute name="Payment Success"><PaymentSuccess /></SafeRoute>
          </Route>
          <Route path="/reservation-confirmation">
            <SafeRoute name="Reservation Confirmation">
              <ProtectedRoute>
                <ReservationConfirmation />
              </ProtectedRoute>
            </SafeRoute>
          </Route>

          {/* ── Rutas autenticadas ─────────────────────────────── */}
          <Route path="/profile">
            <SafeRoute name="Profile">
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            </SafeRoute>
          </Route>
          <Route path="/dashboard">
            <SafeRoute name="Dashboard">
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            </SafeRoute>
          </Route>
          <Route path="/become-instructor">
            <SafeRoute name="Become Instructor">
              <ProtectedRoute>
                <BecomeInstructor />
              </ProtectedRoute>
            </SafeRoute>
          </Route>

          {/* ── Admin / Instructor / Promoter ─────────────────── */}
          <Route path="/admin">
            <SafeRoute name="Admin Dashboard">
              <ProtectedRoute allowedRoles={CREATOR_ROLES}>
                <AdminDashboard />
              </ProtectedRoute>
            </SafeRoute>
          </Route>
          <Route path="/attendance">
            <SafeRoute name="Attendance">
              <ProtectedRoute allowedRoles={CREATOR_ROLES}>
                <AttendanceDashboard />
              </ProtectedRoute>
            </SafeRoute>
          </Route>
          <Route path="/earnings">
            <SafeRoute name="Earnings">
              <ProtectedRoute allowedRoles={CREATOR_ROLES}>
                <Earnings />
              </ProtectedRoute>
            </SafeRoute>
          </Route>

          {/* ── Solo Admin ─────────────────────────────────────── */}
          <Route path="/crm">
            <ProtectedRoute allowedRoles={["admin"]}>
              <CRMDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/withdrawals">
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminWithdrawals />
            </ProtectedRoute>
          </Route>
          <Route path="/email-marketing">
            <ProtectedRoute allowedRoles={["admin"]}>
              <EmailMarketing />
            </ProtectedRoute>
          </Route>
          <Route path="/email-marketing/campaigns/:id">
            <ProtectedRoute allowedRoles={["admin"]}>
              <CampaignDetail />
            </ProtectedRoute>
          </Route>

          {/* ── Staff: ticket scanner ──────────────────────────── */}
          <Route path="/staff/scanner">
            <ProtectedRoute allowedRoles={CREATOR_ROLES}>
              <StaffScanner />
            </ProtectedRoute>
          </Route>

          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
