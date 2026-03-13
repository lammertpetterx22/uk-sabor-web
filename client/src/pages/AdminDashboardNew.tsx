import { useState, useEffect, lazy, Suspense } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, QrCode } from "lucide-react";
import { useLocation } from "wouter";
import DashboardOverview from "@/components/admin/DashboardOverview";
import QuickActions from "@/components/admin/QuickActions";

// Lazy load heavy components for better performance
const EventsTab = lazy(() => import("@/components/admin/EventsTab"));
const CoursesTab = lazy(() => import("@/components/admin/CoursesTab"));
const ClassesTab = lazy(() => import("@/components/admin/ClassesTab"));
const InstructorsTab = lazy(() => import("@/components/admin/InstructorsTab"));
const UsersTab = lazy(() => import("@/components/admin/UsersTab"));
const OrdersTab = lazy(() => import("@/components/admin/OrdersTab"));
const SettingsTab = lazy(() => import("@/components/admin/SettingsTab"));

// Loading fallback
function TabLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        <p className="text-foreground/50 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = user?.role === "admin";
  const isInstructor = user?.role === "instructor";
  const isPromoter = user?.role === "promoter";

  // Start with overview for admins, events for others
  const [activeTab, setActiveTab] = useState(isAdmin ? "overview" : "events");

  // Redirect unauthenticated users
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) setLocation("/login");
  }, [loading, isAuthenticated, setLocation]);

  // Show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-foreground/50 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Check permissions
  if (!isAdmin && !isInstructor && !isPromoter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80">You do not have permission to access this panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="border-b border-border/50 bg-card/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text">
            {isAdmin ? "Admin Dashboard" : isPromoter ? "Promoter Panel" : "Instructor Panel"}
          </h1>
          <div className="flex items-center gap-3">
            {/* Quick Actions */}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 hidden md:flex"
                onClick={() => setLocation("/admin/withdrawals")}
              >
                <span className="text-xs">Withdrawals</span>
              </Button>
            )}
            <a href="/earnings" target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-2">
                <span className="hidden sm:inline">Earnings</span>
              </Button>
            </a>
            <a href="/attendance" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="btn-vibrant gap-2">
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Scan QR</span>
              </Button>
            </a>
            <Badge className={
              isAdmin
                ? "bg-red-500/20 text-red-400 border-red-500/50"
                : isPromoter
                ? "bg-accent/20 text-accent border-accent/50"
                : "bg-purple-500/20 text-purple-400 border-purple-500/50"
            }>
              {isAdmin ? "Admin" : isPromoter ? "Promoter" : "Instructor"}
            </Badge>
            <span className="text-sm text-foreground/60 hidden lg:inline">
              {user?.name || user?.email}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab Navigation */}
          {isAdmin ? (
            <TabsList className="grid w-full grid-cols-8 mb-8 bg-card/50 backdrop-blur-sm">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="classes">Classes</TabsTrigger>
              <TabsTrigger value="instructors">Instructors</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          ) : isInstructor ? (
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-card/50 backdrop-blur-sm">
              <TabsTrigger value="events">My Events</TabsTrigger>
              <TabsTrigger value="classes">My Classes</TabsTrigger>
              <TabsTrigger value="courses">My Courses</TabsTrigger>
              <TabsTrigger value="profile">My Profile</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-card/50 backdrop-blur-sm">
              <TabsTrigger value="events">My Events</TabsTrigger>
              <TabsTrigger value="classes">My Classes</TabsTrigger>
              <TabsTrigger value="profile">My Profile</TabsTrigger>
            </TabsList>
          )}

          {/* Overview Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="overview" className="space-y-8">
              <DashboardOverview />
              <QuickActions />
            </TabsContent>
          )}

          {/* Events Tab */}
          <TabsContent value="events">
            <Suspense fallback={<TabLoading />}>
              <EventsTab user={user} isAdmin={isAdmin} />
            </Suspense>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <Suspense fallback={<TabLoading />}>
              <CoursesTab user={user} isAdmin={isAdmin} />
            </Suspense>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes">
            <Suspense fallback={<TabLoading />}>
              <ClassesTab user={user} isAdmin={isAdmin} />
            </Suspense>
          </TabsContent>

          {/* Instructors Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="instructors">
              <Suspense fallback={<TabLoading />}>
                <InstructorsTab />
              </Suspense>
            </TabsContent>
          )}

          {/* Users Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="users">
              <Suspense fallback={<TabLoading />}>
                <UsersTab />
              </Suspense>
            </TabsContent>
          )}

          {/* Orders Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="orders">
              <Suspense fallback={<TabLoading />}>
                <OrdersTab />
              </Suspense>
            </TabsContent>
          )}

          {/* Settings Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="settings">
              <Suspense fallback={<TabLoading />}>
                <SettingsTab />
              </Suspense>
            </TabsContent>
          )}

          {/* Profile Tab (Instructor/Promoter) */}
          {(isInstructor || isPromoter) && (
            <TabsContent value="profile">
              <div className="max-w-2xl">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>My Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/60">
                      Manage your profile settings. Go to{" "}
                      <a href="/profile" className="text-accent hover:underline">
                        User Profile
                      </a>{" "}
                      to edit your information.
                    </p>
                    <div className="mt-6 space-y-2">
                      <p className="text-sm">
                        <span className="text-foreground/60">Name:</span>{" "}
                        <span className="font-medium">{user?.name}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-foreground/60">Email:</span>{" "}
                        <span className="font-medium">{user?.email}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-foreground/60">Role:</span>{" "}
                        <span className="font-medium capitalize">{user?.role}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-foreground/60">Plan:</span>{" "}
                        <span className="font-medium capitalize">
                          {user?.subscriptionPlan?.replace("_", " ")}
                        </span>
                      </p>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <Button onClick={() => setLocation("/profile")} className="btn-vibrant">
                        Edit Profile
                      </Button>
                      <Button onClick={() => setLocation("/earnings")} variant="outline">
                        View Earnings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
