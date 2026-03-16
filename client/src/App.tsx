import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Eagerly loaded pages (critical path - needed immediately on first load)
import Home from "./pages/Home";
import Login from "./pages/Login";

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

// Loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 border-4 border-[#FA3698]/30 border-t-[#FA3698] rounded-full animate-spin"
          aria-label="Loading"
        />
        <p className="text-white/50 text-sm">Cargando...</p>
      </div>
    </div>
  );
}

/** Roles que pueden acceder al panel admin/creator */
const CREATOR_ROLES = ["admin", "instructor", "promoter"];

function Router() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          {/* ── Rutas públicas ─────────────────────────────────── */}
          <Route path="/" component={Home} />
          <Route path="/events" component={Events} />
          <Route path="/events/:id" component={EventDetail} />
          <Route path="/courses" component={Courses} />
          <Route path="/courses/:id" component={CourseDetail} />
          <Route path="/classes" component={Classes} />
          <Route path="/classes/:id" component={ClassDetail} />
          <Route path="/instructors" component={Instructors} />
          <Route path="/instructors/:id" component={InstructorProfile} />
          <Route path="/promoters" component={Promoters} />
          <Route path="/promoters/:id" component={PromoterProfile} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/image-cropper-demo" component={ImageCropperDemo} />
          <Route path="/image-cropper-pro" component={ImageCropperProDemo} />
          <Route path="/login" component={Login} />
          <Route path="/payment-success" component={PaymentSuccess} />

          {/* ── Rutas autenticadas ─────────────────────────────── */}
          <Route path="/profile">
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          </Route>
          <Route path="/dashboard">
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/become-instructor">
            <ProtectedRoute>
              <BecomeInstructor />
            </ProtectedRoute>
          </Route>

          {/* ── Admin / Instructor / Promoter ─────────────────── */}
          <Route path="/admin">
            <ProtectedRoute allowedRoles={CREATOR_ROLES}>
              <AdminDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/attendance">
            <ProtectedRoute allowedRoles={CREATOR_ROLES}>
              <AttendanceDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/earnings">
            <ProtectedRoute allowedRoles={CREATOR_ROLES}>
              <Earnings />
            </ProtectedRoute>
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
