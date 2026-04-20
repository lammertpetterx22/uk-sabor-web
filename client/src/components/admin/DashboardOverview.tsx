import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Calendar,
  GraduationCap,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
  ShoppingCart,
  UserCheck,
  QrCode,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

function MetricCard({ title, value, description, icon, trend, loading }: MetricCardProps) {
  if (loading) {
    return (
      <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-accent/30 transition-all group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <div className="text-accent scale-[2.5]">{icon}</div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground/60">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-foreground/50 mt-1">{description}</p>
        )}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.isPositive ? "text-green-500" : "text-red-500"}`}>
            {trend.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{trend.isPositive ? "+" : ""}{trend.value}% vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardOverview() {
  // Fetch all metrics
  const { data: users, isLoading: usersLoading } = trpc.admin.listUsers.useQuery();
  const { data: events, isLoading: eventsLoading } = trpc.events.listAll.useQuery({ limit: 100, offset: 0 });
  const { data: courses, isLoading: coursesLoading } = trpc.courses.listAll.useQuery({ limit: 100, offset: 0 });
  const { data: classes, isLoading: classesLoading } = trpc.classes.listAll.useQuery({ limit: 100, offset: 0 });
  const { data: withdrawals, isLoading: withdrawalsLoading } = trpc.financials.adminListWithdrawals.useQuery();

  // Calculate metrics
  const totalUsers = users?.length || 0;
  const activeEvents = events?.filter(e => e.status === "published").length || 0;
  const totalCourses = courses?.filter(c => c.status === "published").length || 0;
  const totalClasses = classes?.filter(c => c.status === "published").length || 0;

  const pendingWithdrawals = withdrawals?.filter(w => w.request.status === "pending").length || 0;
  const totalWithdrawalAmount = withdrawals
    ?.filter(w => w.request.status === "pending")
    .reduce((sum, w) => sum + parseFloat(String(w.request.amount)), 0) || 0;

  const instructors = users?.filter(u => u.role === "instructor").length || 0;
  const promoters = users?.filter(u => u.role === "promoter").length || 0;
  const regularUsers = users?.filter(u => u.role === "user").length || 0;

  // Quick stats for recent activity (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentUsers = users?.filter(u => new Date(u.createdAt) > oneWeekAgo).length || 0;
  const recentEvents = events?.filter(e => new Date(e.createdAt) > oneWeekAgo).length || 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight gradient-text">Dashboard Overview</h2>
        <p className="text-foreground/60 mt-2">Monitor your platform's key metrics and performance</p>
      </div>

      {/* Quick Tools — moved here from the sidebar so all creator shortcuts live under one roof */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/earnings"
          className="group rounded-xl border border-border/50 bg-gradient-to-br from-green-500/10 to-emerald-500/5 hover:border-green-500/50 p-5 transition-all flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-green-500/15">
            <Wallet className="h-6 w-6 text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground">Earnings</div>
            <div className="text-xs text-foreground/60">Balance, sales & withdrawals</div>
          </div>
          <ArrowRight className="h-5 w-5 text-foreground/30 group-hover:text-foreground/70 transition-colors" />
        </Link>
        <Link
          href="/attendance"
          className="group rounded-xl border border-border/50 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 hover:border-blue-500/50 p-5 transition-all flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-blue-500/15">
            <QrCode className="h-6 w-6 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground">Attendance</div>
            <div className="text-xs text-foreground/60">Scan QR codes at the door</div>
          </div>
          <ArrowRight className="h-5 w-5 text-foreground/30 group-hover:text-foreground/70 transition-colors" />
        </Link>
        <Link
          href="/pricing"
          className="group rounded-xl border border-border/50 bg-gradient-to-br from-amber-500/10 to-orange-500/5 hover:border-amber-500/50 p-5 transition-all flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-amber-500/15">
            <BarChart3 className="h-6 w-6 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground">Plans</div>
            <div className="text-xs text-foreground/60">Upgrade your subscription</div>
          </div>
          <ArrowRight className="h-5 w-5 text-foreground/30 group-hover:text-foreground/70 transition-colors" />
        </Link>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={totalUsers}
          description={`+${recentUsers} this week`}
          icon={<Users />}
          loading={usersLoading}
        />
        <MetricCard
          title="Active Events"
          value={activeEvents}
          description={`${events?.length || 0} total events`}
          icon={<Calendar />}
          loading={eventsLoading}
        />
        <MetricCard
          title="Published Courses"
          value={totalCourses}
          description={`${courses?.length || 0} total courses`}
          icon={<GraduationCap />}
          loading={coursesLoading}
        />
        <MetricCard
          title="Active Classes"
          value={totalClasses}
          description={`${classes?.length || 0} total classes`}
          icon={<Clock />}
          loading={classesLoading}
        />
      </div>

      {/* Financial Metrics */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Financial Overview</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Pending Withdrawals"
            value={pendingWithdrawals}
            description="Requests awaiting approval"
            icon={<Wallet />}
            loading={withdrawalsLoading}
          />
          <MetricCard
            title="Total Pending Amount"
            value={`£${totalWithdrawalAmount.toFixed(2)}`}
            description="Sum of pending withdrawals"
            icon={<DollarSign />}
            loading={withdrawalsLoading}
          />
          <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-accent/10 to-accent/5 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground/60 flex items-center gap-2">
                <CheckCircle className="text-green-500" size={16} />
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingWithdrawals > 0 ? (
                <>
                  <div className="text-3xl font-bold text-accent">{pendingWithdrawals}</div>
                  <p className="text-xs text-foreground/60 mt-1">
                    withdrawal{pendingWithdrawals !== 1 ? "s" : ""} need{pendingWithdrawals === 1 ? "s" : ""} review
                  </p>
                  <a
                    href="/admin/withdrawals"
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline mt-2"
                  >
                    Review now →
                  </a>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-500">0</div>
                  <p className="text-xs text-foreground/60 mt-1">All caught up!</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Distribution */}
      <div>
        <h3 className="text-xl font-semibold mb-4">User Distribution</h3>
        <div className="grid gap-6 md:grid-cols-3">
          <MetricCard
            title="Instructors"
            value={instructors}
            description={`${((instructors / totalUsers) * 100).toFixed(1)}% of users`}
            icon={<UserCheck />}
            loading={usersLoading}
          />
          <MetricCard
            title="Promoters"
            value={promoters}
            description={`${((promoters / totalUsers) * 100).toFixed(1)}% of users`}
            icon={<UserCheck />}
            loading={usersLoading}
          />
          <MetricCard
            title="Regular Users"
            value={regularUsers}
            description={`${((regularUsers / totalUsers) * 100).toFixed(1)}% of users`}
            icon={<Users />}
            loading={usersLoading}
          />
        </div>
      </div>

      {/* Recent Activity Summary */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Recent Activity (Last 7 Days)</CardTitle>
          <CardDescription>Quick overview of new content and users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentUsers}</p>
                <p className="text-xs text-foreground/60">New Users</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentEvents}</p>
                <p className="text-xs text-foreground/60">New Events</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeEvents}</p>
                <p className="text-xs text-foreground/60">Active Events</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <GraduationCap className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCourses}</p>
                <p className="text-xs text-foreground/60">Published Courses</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
