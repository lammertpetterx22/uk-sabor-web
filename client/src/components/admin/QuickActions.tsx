import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  GraduationCap,
  Users,
  Clock,
  Plus,
  Wallet,
  BarChart3,
  Settings,
  Mail
} from "lucide-react";
import { Link } from "wouter";

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
}

function QuickActionCard({ icon, title, description, href, color }: QuickActionProps) {
  return (
    <Link href={href}>
      <Card className="cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm hover:border-accent/30 hover:bg-card/70 transition-all group">
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
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function QuickActions() {
  const actions: QuickActionProps[] = [
    {
      icon: <Calendar className="h-5 w-5 text-blue-500" />,
      title: "Create Event",
      description: "Add a new event to the platform",
      href: "/admin?tab=events&action=create",
      color: "bg-blue-500/10"
    },
    {
      icon: <GraduationCap className="h-5 w-5 text-purple-500" />,
      title: "Create Course",
      description: "Add a new online course",
      href: "/admin?tab=courses&action=create",
      color: "bg-purple-500/10"
    },
    {
      icon: <Clock className="h-5 w-5 text-orange-500" />,
      title: "Create Class",
      description: "Schedule a new class session",
      href: "/admin?tab=classes&action=create",
      color: "bg-orange-500/10"
    },
    {
      icon: <Users className="h-5 w-5 text-green-500" />,
      title: "Manage Users",
      description: "View and edit user accounts",
      href: "/admin?tab=users",
      color: "bg-green-500/10"
    },
    {
      icon: <Wallet className="h-5 w-5 text-yellow-500" />,
      title: "Withdrawals",
      description: "Review pending payout requests",
      href: "/admin/withdrawals",
      color: "bg-yellow-500/10"
    },
    {
      icon: <Mail className="h-5 w-5 text-pink-500" />,
      title: "Email Campaign",
      description: "Send emails to your users",
      href: "/email-marketing",
      color: "bg-pink-500/10"
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-cyan-500" />,
      title: "CRM Dashboard",
      description: "Manage contacts and interactions",
      href: "/crm",
      color: "bg-cyan-500/10"
    },
    {
      icon: <Settings className="h-5 w-5 text-gray-500" />,
      title: "Settings",
      description: "Configure platform settings",
      href: "/admin?tab=settings",
      color: "bg-gray-500/10"
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold">Quick Actions</h3>
        <p className="text-foreground/60 text-sm mt-1">Common tasks and shortcuts</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {actions.map((action, index) => (
          <QuickActionCard key={index} {...action} />
        ))}
      </div>
    </div>
  );
}
