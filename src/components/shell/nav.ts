// ============================================================================
//  Navigation config — single source of truth for routes & icons.
// ============================================================================
import {
  LayoutDashboard,
  FlaskConical,
  Cpu,
  Gamepad2,
  LineChart,
  Map,
  Newspaper,
  Building2,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/research", label: "Recherche", icon: FlaskConical },
  { href: "/product", label: "Produits", icon: Cpu },
  { href: "/game", label: "Jeux", icon: Gamepad2 },
  { href: "/market", label: "Bourse", icon: LineChart },
  { href: "/competitors", label: "Concurrents", icon: Map },
  { href: "/events", label: "Événements", icon: Newspaper },
  { href: "/hq", label: "Siège", icon: Building2 },
  { href: "/settings", label: "Réglages", icon: Settings },
];
