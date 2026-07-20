import { Link } from "react-router-dom";
import { ArrowRight, Leaf, Recycle, Shield, Truck, UserCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PUBLIC_ROLES = [
  {
    id: "trial",
    title: "Trial Member",
    description: "Start your sustainability journey with a 5-day trial.",
    icon: Zap,
    loginPath: "/login?intent=trial",
  },
  {
    id: "member",
    title: "Permanent Member",
    description: "Full marketplace, wallet, and rewards access.",
    icon: UserCircle,
    loginPath: "/login?intent=member",
  },
  {
    id: "supervisor",
    title: "Supervisor",
    description: "Verify waste, assign agents, and monitor operations.",
    icon: Shield,
    loginPath: "/login?intent=supervisor",
  },
  {
    id: "delivery",
    title: "Delivery Agent",
    description: "Manage pickups, routes, and proof uploads.",
    icon: Truck,
    loginPath: "/login?intent=delivery",
  },
  {
    id: "recycler",
    title: "Recycler",
    description: "Process shipments, payments, and sustainability metrics.",
    icon: Recycle,
    loginPath: "/login?intent=recycler",
  },
];

export default function LandingPage() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm text-primary mb-6">
          <Leaf className="h-4 w-4" />
          Circular economy platform
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">EcoXchange</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Connect citizens, recyclers, and delivery agents to turn waste into value — with
          real-time tracking, rewards, and a recycled marketplace.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg">
            <Link to="/login">
              Sign in with phone <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/roles">Explore roles</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function RolesPage() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Choose your role</h1>
        <p className="text-muted-foreground">
          Five public roles — sign in with your registered phone number.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {PUBLIC_ROLES.map((role) => {
          const Icon = role.icon;
          return (
            <Card key={role.id} className="flex flex-col">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{role.title}</CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild className="w-full">
                  <Link to={role.loginPath}>Sign in</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
