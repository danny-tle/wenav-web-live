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
    avatar: "/assets/person2.png",
  },
  {
    name: "Danny Le",
    role: "Mobile/Web Engineer",
    avatar: "/assets/person3.png",
  },
  {
    name: "Teresa Park",
    role: "UX/UI Engineer",
    avatar: "/assets/person1.png",
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
    title: "Record only \n what matters.",
    description:
      "Capture short, video segments when incidents occur.",
  },
  {
    icon: "/assets/headset_icon.png",
    title: "Stay aware of \n what’s ahead.",
    description:
      "Detect nearby obstacles and potential collision risks in real time.",
  },
  {
    icon: "/assets/notification_icon.png",
    title: "Get alerted only \n when it matters.",
    description:
      "Let us guide you—quietly, intelligently, and only when needed.",
  },
  {
    icon: "/assets/share_icon.png",
    title: "Support multiple \n users with trust.",
    description:
      "Connect with your helper to support through a role-based system.",
  },
  {
    icon: "/assets/folder_icon.png",
    title: "Privacy first. \n Always.",
    description:
      "Ensure safety data is reviewed and approved before being shared.",
  },
];

export const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Download", href: "#download" },
  { label: "Content", href: "#content" },
  { label: "Features", href: "#features" },
  { label: "Team", href: "#team" },
];
