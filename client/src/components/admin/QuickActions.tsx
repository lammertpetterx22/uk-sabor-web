import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  GraduationCap,
  Users,
  Clock,
  Wallet,
  BarChart3,
} from "lucide-react";
import { useLocation } from "wouter";

/** Action keys that AdminDashboard knows how to handle. */
export type QuickAction =
  | "create-event"
  | "create-class"
  | "create-course"
  | "manage-users";

interface QuickActionsProps {
  /** Called when the admin clicks a card that maps to an internal tab/dialog. */
  onAction?: (action: QuickAction) => void;
}

interface CardDef {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}

function ActionCard({ icon, title, description, color, onClick }: CardDef) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left"
    >
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
    </button>
  );
}

export default function QuickActions({ onAction }: QuickActionsProps) {
  const [, setLocation] = useLocation();

  const cards: CardDef[] = [
    {
      icon: <Calendar className="h-5 w-5 text-blue-500" />,
      title: "Create Event",
      description: "Add a new event to the platform",
      color: "bg-blue-500/10",
      onClick: () => onAction?.("create-event"),
    },
    {
      icon: <GraduationCap className="h-5 w-5 text-purple-500" />,
      title: "Create Course",
      description: "Add a new online course",
      color: "bg-purple-500/10",
      onClick: () => onAction?.("create-course"),
    },
    {
      icon: <Clock className="h-5 w-5 text-orange-500" />,
      title: "Create Class",
      description: "Schedule a new class session",
      color: "bg-orange-500/10",
      onClick: () => onAction?.("create-class"),
    },
    {
      icon: <Users className="h-5 w-5 text-green-500" />,
      title: "Manage Users",
      description: "View and edit user accounts",
      color: "bg-green-500/10",
      onClick: () => onAction?.("manage-users"),
    },
    {
      icon: <Wallet className="h-5 w-5 text-yellow-500" />,
      title: "Withdrawals",
      description: "Review pending payout requests",
      color: "bg-yellow-500/10",
      onClick: () => setLocation("/admin/withdrawals"),
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-cyan-500" />,
      title: "CRM Dashboard",
      description: "Manage contacts and interactions",
      color: "bg-cyan-500/10",
      onClick: () => setLocation("/crm"),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold">Quick Actions</h3>
        <p className="text-foreground/60 text-sm mt-1">Common tasks and shortcuts</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <ActionCard key={i} {...c} />
        ))}
      </div>
    </div>
  );
}
