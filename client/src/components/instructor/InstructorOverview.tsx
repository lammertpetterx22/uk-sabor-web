import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  GraduationCap,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  Plus,
  Wallet,
  BarChart3,
  CheckCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function StatCard({ title, value, description, icon, color, loading, action }: StatCardProps) {
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-border/50 bg-card/50 backdrop-blur-sm hover:border-${color}/30 transition-all group relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
        <div className={`text-${color} scale-[2]`}>{icon}</div>
      </div>
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg bg-${color}/10`}>
            {icon}
          </div>
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
        <p className="text-sm text-foreground/60 mb-3">{title}</p>
        {description && (
          <p className="text-xs text-foreground/50">{description}</p>
        )}
        {action && (
          <Button
            size="sm"
            variant="ghost"
            className="mt-3 w-full text-xs"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}

function QuickActionCard({ icon, title, description, onClick, color }: QuickActionCardProps) {
  return (
    <Card
      className="cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm hover:border-accent/30 hover:bg-card/70 transition-all group"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
              {title}
            </h3>
            <p className="text-sm text-foreground/60 mt-1">{description}</p>
          </div>
          <Plus className="h-5 w-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function InstructorOverview({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const { user } = useAuth();
  const isInstructor = user?.role === "instructor";
  const isPromoter = user?.role === "promoter";

  // Fetch data
  const { data: events, isLoading: eventsLoading } = trpc.events.listAll.useQuery({ limit: 1000, offset: 0 });
  const { data: classes, isLoading: classesLoading } = trpc.classes.listAll.useQuery({ limit: 1000, offset: 0 });
  const { data: courses, isLoading: coursesLoading } = isInstructor
    ? trpc.courses.listAll.useQuery({ limit: 1000, offset: 0 })
    : { data: null, isLoading: false };
  const { data: wallet, isLoading: walletLoading } = trpc.financials.getWallet.useQuery();

  // Calculate stats
  const myEvents = events?.filter(e => e.status === "published") || [];
  const myClasses = classes?.filter(c => c.status === "published") || [];
  const myCourses = courses?.filter(c => c.status === "published") || [];

  const totalEarnings = parseFloat(String(wallet?.totalEarned || 0));
  const availableBalance = parseFloat(String(wallet?.currentBalance || 0));

  // Quick actions
  const quickActions = [
    {
      icon: <Calendar className="h-5 w-5 text-blue-500" />,
      title: "Create Event",
      description: "Add a new event to your schedule",
      onClick: () => onTabChange("events"),
      color: "bg-blue-500/10"
    },
    {
      icon: <Clock className="h-5 w-5 text-purple-500" />,
      title: "Create Class",
      description: "Schedule a new class session",
      onClick: () => onTabChange("classes"),
      color: "bg-purple-500/10"
    }
  ];

  if (isInstructor) {
    quickActions.push({
      icon: <GraduationCap className="h-5 w-5 text-orange-500" />,
      title: "Create Course",
      description: "Publish a new online course",
      onClick: () => onTabChange("courses"),
      color: "bg-orange-500/10"
    });
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h2 className="text-3xl font-bold gradient-text">
          Welcome back, {user?.name}!
        </h2>
        <p className="text-foreground/60 mt-2">
          Here's an overview of your content and earnings
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Events"
          value={myEvents.length}
          description={`${events?.filter(e => e.status === "draft").length || 0} draft events`}
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
          color="blue-500"
          loading={eventsLoading}
          action={{
            label: "View All Events",
            onClick: () => onTabChange("events")
          }}
        />
        <StatCard
          title="My Classes"
          value={myClasses.length}
          description={`${classes?.filter(c => c.status === "draft").length || 0} draft classes`}
          icon={<Clock className="h-5 w-5 text-purple-500" />}
          color="purple-500"
          loading={classesLoading}
          action={{
            label: "View All Classes",
            onClick: () => onTabChange("classes")
          }}
        />
        {isInstructor && (
          <StatCard
            title="My Courses"
            value={myCourses.length}
            description={`${courses?.filter(c => c.status === "draft").length || 0} draft courses`}
            icon={<GraduationCap className="h-5 w-5 text-orange-500" />}
            color="orange-500"
            loading={coursesLoading}
            action={{
              label: "View All Courses",
              onClick: () => onTabChange("courses")
            }}
          />
        )}
        <StatCard
          title="Available Balance"
          value={`£${availableBalance.toFixed(2)}`}
          description={`£${totalEarnings.toFixed(2)} total earned`}
          icon={<Wallet className="h-5 w-5 text-green-500" />}
          color="green-500"
          loading={walletLoading}
        />
      </div>

      {/* Earnings Card */}
      <Card className="border-border/50 bg-gradient-to-br from-accent/10 to-accent/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-accent" />
            Your Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-foreground/60 mb-1">Total Earned</p>
              <p className="text-3xl font-bold text-foreground">
                £{totalEarnings.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground/60 mb-1">Available to Withdraw</p>
              <p className="text-3xl font-bold text-green-500">
                £{availableBalance.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center">
              <Link href="/earnings">
                <Button className="btn-vibrant w-full">
                  <Wallet className="h-4 w-4 mr-2" />
                  View Earnings Details
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => (
            <QuickActionCard key={index} {...action} />
          ))}
        </div>
      </div>

      {/* Plan Info */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            Your Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-accent capitalize">
                {user?.subscriptionPlan?.replace("_", " ")}
              </p>
              <p className="text-sm text-foreground/60 mt-1">
                Commission: {
                  user?.subscriptionPlan === "academy" ? "0%" :
                  user?.subscriptionPlan === "promoter_plan" ? "5%" :
                  user?.subscriptionPlan === "creator" ? "10%" : "15%"
                } on courses
              </p>
            </div>
            <Link href="/pricing">
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
