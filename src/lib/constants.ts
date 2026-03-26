import { TeamMember, Feature } from "./types";

export const COLORS = {
  primary: "#5C00F2",
  dark: "#0D0D0D",
  lightGray: "#F2F2F7",
  white: "#FFFFFF",
  clusterTeal: "#00BCD4",
  approved: "#22C55E",
  notConfirmed: "#EF4444",
  underReview: "#F97316",
} as const;

export const MAP_DEFAULTS = {
  center: [40.7608, -111.891] as [number, number],
  zoom: 13,
} as const;

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Jewan Chae",
    role: "Mobile/Hardware Engineer",
    avatar: "/assets/person1.png",
  },
  {
    name: "Danny Le",
    role: "Mobile/Web Engineer",
    avatar: "/assets/person2.png",
  },
  {
    name: "Teresa Park",
    role: "UX/UI Engineer",
    avatar: "/assets/person3.png",
  },
  {
    name: "Ethan Nguyen",
    role: "Mobile/Web Engineer",
    avatar: "/assets/person4.png",
  },
  {
    name: "Tommy Chadwick",
    role: "Web/Hardware Engineer",
    avatar: "/assets/person5.png",
  },
];

export const FEATURES: Feature[] = [
  {
    icon: "/assets/camera_icon.png",
    title: "Obstacle Detection",
    description:
      "Real-time camera-based detection of obstacles in your path using computer vision.",
  },
  {
    icon: "/assets/headset_icon.png",
    title: "Audio Feedback",
    description:
      "Voice guidance and audio alerts for safe navigation assistance.",
  },
  {
    icon: "/assets/notification_icon.png",
    title: "Smart Alerts",
    description:
      "Instant notifications for caregivers when incidents occur.",
  },
  {
    icon: "/assets/share_icon.png",
    title: "Location Sharing",
    description:
      "Share your location with trusted caregivers in real-time.",
  },
  {
    icon: "/assets/folder_icon.png",
    title: "Incident Reports",
    description:
      "Log and track obstacles to improve community safety over time.",
  },
];

export const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Download", href: "#download" },
  { label: "Content", href: "#content" },
  { label: "Features", href: "#features" },
  { label: "Team", href: "#team" },
];
