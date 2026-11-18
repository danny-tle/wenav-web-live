import { TeamMember, Feature, TutorialStep } from "./types";

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
    name: "Teresa Park",
    role: "UX Designer / Design Engineer",
    bio:
      "Teresa Miyeon Park studied Computer Science at the University of Utah and focuses on product design and UX/UI. " +
      "For her senior capstone project, WeNav, she led branding, information architecture, and interface design across " +
      "mobile and web platforms. Her work combined usability testing, user feedback, and front-end improvements to create " +
      "clearer, more consistent experiences. She also served as President of Adobe Student Ambassadors and worked as an " +
      "Adobe Creative Consultant, supporting student creativity through workshops and community events. With a Google UX " +
      "Design Professional Certificate, Teresa is interested in making complex technology more accessible through " +
      "thoughtful, user-centered design.",
    avatar: "/assets/team/teresa.JPG",
    email: "u1426363@utah.edu",
    linkedin: "linkedin.com/in/parkteresa/",
  },
  {
    name: "Danny Le",
    role: "Mobile/Web Engineer",
    bio: 
      "Danny Le is a student at the University of Utah studying Computer Science. For his senior capstone project, WeNav, " +
      "he set up both the Next.js web platform and the Flutter mobile app, and helped build the system that connects them: " +
      "Firebase sign-up with email verification, caregiver pairing, live location sharing, and incident reporting. He also " +
      "added background walk tracking with GPS filtering on iOS, and worked on accessibility features like spoken feedback " +
      "and screen-reader support. Danny is interested in expanding his skillset in areas involving software development and " +
      "is always looking for opportunities to learn and grow.",
    avatar: "/assets/team/danny.jpg",
    email: "dannyle4.contact@gmail.com",
    linkedin: "linkedin.com/in/dannyle4",
  },
  {
    name: "Jewan Chae",
    role: "Mobile/Hardware Engineer",
    bio: "[to be updated]",
    linkedin: "linkedin.com/in/jewanc",
  },
  {
    name: "Thomas Chadwick",
    role: "Web/Hardware Engineer",
    bio: "[to be updated]",
    linkedin: "linkedin.com/in/thomaskchadwick",
  },
  {
    name: "Ethan Nguyen",
    role: "Mobile/Web Engineer",
    avatar: "/assets/team/ethan.jpg",
    bio: "I am Ethan Nguyen, a Computer Science student at the University of Utah, expecting to graduate in December 2026 with a " +
    "Bachelor's degree in Computer Science. My interests include software engineering, full-stack web development, mobile " +
    "application development, and building practical solutions to real-world problems. For my senior capstone project, I am " +
    "working on We-Nav, a web and mobile application. This project has given me the opportunity to apply my technical knowledge " +
    "in a collaborative environment while strengthening my skills in software development, problem-solving, and teamwork. I am also " +
    "currently interning at SAPA Investment Group, where I have been involved in developing websites for Fat Fish and Dragonfly " +
    "Processing. These projects have allowed me to gain hands-on experience with modern web technologies, including Next.js, " +
    "Firebase, Firestore, and Vercel, while working on real-world applications. Outside of my internship and academic work, I " + 
    "have taken on freelance development projects, including creating an e-commerce website for Elliott and Me. These experiences " +
    "have strengthened my interest in creating user-friendly applications and expanding my skills as a developer. After graduation, " +
    "I hope to pursue a career in software engineering, where I can continue learning and developing meaningful technology.",
    email: "edn42102@gmail.com",
    linkedin: "linkedin.com/in/ethan-nguyen-421-",
  },
];

export const FEATURES: Feature[] = [
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
    icon: "/assets/camera_icon.png",
    title: "Record only \n what matters.",
    description:
      "Capture short, video segments when incidents occur.",
  },
  {
    icon: "/assets/folder_icon.png",
    title: "Privacy first. \n Always.",
    description:
      "Ensure safety data is reviewed and approved before being shared.",
  },
  {
    icon: "/assets/share_icon.png",
    title: "Support multiple \n users with trust.",
    description:
      "Connect with your helper to support through a role-based system.",
  },
];

export const WALKER_TUTORIAL_STEPS: TutorialStep[] = [
  { title: "Install the app", description: "Download WeNav for Android or iOS from the Download section." },
  { title: "Create your account", description: "Sign up with your email, then confirm it with the verification link." },
  { title: "Pair the belt", description: "Turn on the belt and connect to it over Bluetooth from the app." },
  { title: "Connect a caregiver", description: "Share the pairing code shown in the app with your caregiver." },
  { title: "Start a walk", description: "Tap Start Walk. The belt watches the path ahead and the app alerts you to obstacles." },
  { title: "Report an incident", description: "If something happens, tap Report an Incident. A short video is saved and reviewed before anything is shared." },
  { title: "End the walk", description: "Tap Stop Walk. Check battery level and goal progress on the home screen." },
];

export const CAREGIVER_TUTORIAL_STEPS: TutorialStep[] = [
  { title: "Sign in", description: "Open the WeNav web dashboard on a computer and log in." },
  { title: "Enter the pairing code", description: "Type in the code from the walker's app to link your accounts." },
  { title: "Follow along", description: "See device status, walks and incident reports on the Caregiver Dashboard." },
  { title: "Check the map", description: "View public incidents and high-risk areas on the interactive map." },
];

export const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Tutorial", href: "#tutorial" },
  { label: "Team", href: "#team" },
  { label: "Download", href: "#download" },
];
