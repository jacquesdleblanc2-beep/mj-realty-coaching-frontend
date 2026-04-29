export type DeadlineLevel = "critical" | "urgent" | "warning" | "info" | "none";

export interface InitialSetupItem {
  id: string;
  tabId: string;
  order: number;
  subject: string;
  sender: string;
  timing: string;
  why: string;
  actions: string[];
  deadline: string | null;
  deadlineLevel: DeadlineLevel;
  consequence: string | null;
}

export interface InitialSetupTab {
  id: string;
  label: string;
  emoji: string;
  description: string;
  status: "active" | "coming_soon";
}

export const INITIAL_SETUP_TABS: InitialSetupTab[] = [
  {
    id: "board-emails",
    label: "Emails from Board",
    emoji: "📧",
    description:
      "In your first 4 days you'll receive 6 emails from the Board. Each one has a job. Check them off as you handle them.",
    status: "active",
  },
  {
    id: "rezen-training",
    label: "reZEN & Real",
    emoji: "🏢",
    description: "Get set up on Real Brokerage's tools.",
    status: "coming_soon",
  },
  {
    id: "marketing-setup",
    label: "Marketing",
    emoji: "📣",
    description: "Business cards, signs, social, headshots.",
    status: "coming_soon",
  },
  {
    id: "tools-setup",
    label: "Tools & Tech",
    emoji: "🛠️",
    description: "Matrix, Touchbase, Supra, WEBForms — get them all configured.",
    status: "coming_soon",
  },
];

export const INITIAL_SETUP_ITEMS: InitialSetupItem[] = [
  {
    id: "board_email_1_membership_received",
    tabId: "board-emails",
    order: 1,
    subject: "Email 1 — Membership Application Received!",
    sender: "Member Services (memberservices@nbrealestateboard.com)",
    timing: "Arrives Day 1 — within minutes of submitting your application",
    why: "First contact from the Board confirming they got your application. It contains 5 critical rules you cannot miss.",
    actions: [
      "If you pay CREA dues at another Board, send proof IMMEDIATELY so you are not double-charged.",
      "Note that the New Member invoice will be sent to Creativ Realty (the Agency) for payment — not to you.",
      "Confirm your Work Email on the application is active and accessible — your Matrix login goes there.",
      "Read and sign the attached Supra Ekey Agreement and return it ASAP. No signed agreement = no Supra access = no lockbox = no showings.",
      "Note the office locations for buying lockboxes: Moncton (541 St. George Blvd), Saint John (18 Station Rd, Rothesay), Fredericton (544 Brunswick St).",
    ],
    deadline: "ASAP",
    deadlineLevel: "warning",
    consequence: null,
  },
  {
    id: "board_email_2_nbreb_login",
    tabId: "board-emails",
    order: 2,
    subject: "Email 2 — Welcome to New Brunswick Real Estate Board (NBREB)",
    sender: "support@nbrealestateboard.com",
    timing: "Arrives Day 1 — usually within a minute of Email 1",
    why: "Gives you your NBREB Login ID and the registration link to access the Board's services.",
    actions: [
      "Find your Login ID in the email (format: 6 letters, e.g. ROBICKA).",
      "Click the registration link and complete your NBREB account setup.",
    ],
    deadline: "48 hours — link expires!",
    deadlineLevel: "urgent",
    consequence:
      "Link expires after 48 hours. If missed, contact support@nbrealestateboard.com to request a new one.",
  },
  {
    id: "board_email_3_realtor_ca_sso",
    tabId: "board-emails",
    order: 3,
    subject: "Email 3 — Create your login: REALTOR.ca / CREA SSO",
    sender: "REALTOR.ca <noreply@realtor.ca>",
    timing: "Arrives Day 1 — about 10–15 minutes after Email 2",
    why: "Single Sign-On setup for everything CREA gives you: WEBForms, Member.realtor.ca, Member.CREA.ca, Learning.CREA.ca, and the REALTOR.ca Member App.",
    actions: [
      "Click 'Set up my login' in the email.",
      "Create your CREA SSO password.",
      "Bookmark Learning.CREA.ca — you'll need it for the New Member Mini Course (see Email 5).",
      "Bookmark CREA WEBForms — this is where the Purchase and Sale Agreement, Listing Agreement, and other forms live.",
    ],
    deadline: "No hard deadline, but do it Day 1",
    deadlineLevel: "info",
    consequence: null,
  },
  {
    id: "board_email_4_eula_accepted",
    tabId: "board-emails",
    order: 4,
    subject: "Email 4 — EULA Accepted!",
    sender: "support@nbrealestateboard.com",
    timing: "Arrives Day 1 — a few hours after you click the registration link in Email 2",
    why: "Confirmation that you accepted the End User License Agreement. The signed EULA is attached for your records.",
    actions: [
      "Save the attached signed EULA to your records.",
      "No further action required — confirmation only.",
    ],
    deadline: null,
    deadlineLevel: "none",
    consequence: null,
  },
  {
    id: "board_email_5_welcome_orientation",
    tabId: "board-emails",
    order: 5,
    subject: "Email 5 — Welcome! / Bienvenue!",
    sender: "Member Services (memberservices@nbrealestateboard.com)",
    timing: "Arrives Day 3 or 4 — once your signed Ekey Agreement and fees are received",
    why: "This is the big one. It activates your Supra access AND tells you what's mandatory to keep your access.",
    actions: [
      "Complete the CREA New Member Mini Course at https://learning.crea.ca BEFORE your board orientation session — this is mandatory.",
      "Wait for an email telling you when your New Member Orientation session is scheduled.",
      "If you cannot attend, call (506) 634-8772 or email support@nbrealestateboard.com BEFORE the session.",
      "Download the 'Supra eKey' app on your phone.",
      "Activate Supra: open app → 'Activate eKey App' → 'I already have an authorization code' → enter the code from your email (NOT case-sensitive). Authorization code expires in 24 hours.",
      "Note your default PIN is 2235 — you'll use this to open lockboxes. Email Member Services to change it.",
      "Download the Touchbase SM2 app — use the same login as Matrix.",
    ],
    deadline: "Supra activation code expires in 24 hours",
    deadlineLevel: "critical",
    consequence:
      "NO-SHOW for orientation = SUSPENSION of your access until you complete a session. Miss more than one = suspension. Always notify the Board if you can't attend.",
  },
  {
    id: "board_email_6_matrix_credentials",
    tabId: "board-emails",
    order: 6,
    subject: "Email 6 — Your Matrix (MLS®) Login Credentials",
    sender: "NBREB Matrix system — sent to your Work Email",
    timing: "Arrives Day 3 or 4 — separately, after Email 5",
    why: "This gives you access to the MLS® system. Without Matrix you cannot list, search, or show properties.",
    actions: [
      "Check your Work Email inbox AND spam/junk folders.",
      "Click the Matrix registration link and set your password.",
      "Once in, optionally email a professional photo to memberservices@nbrealestateboard.com — it appears on Matrix and on your REALTOR.ca profile.",
      "Use the same Matrix credentials when logging into Touchbase SM2.",
    ],
    deadline: "Matrix registration email expires in 24 hours",
    deadlineLevel: "critical",
    consequence:
      "If the link expires you may not receive your login credentials and will need to contact memberservices@nbrealestateboard.com to reset.",
  },
];

export function getActiveTabItems(tabId: string): InitialSetupItem[] {
  return INITIAL_SETUP_ITEMS
    .filter((item) => item.tabId === tabId)
    .sort((a, b) => a.order - b.order);
}

export function getTotalItemCount(): number {
  return INITIAL_SETUP_ITEMS.length;
}

export function getCompletedItemCount(completed: string[]): number {
  const allIds = new Set(INITIAL_SETUP_ITEMS.map((i) => i.id));
  return completed.filter((id) => allIds.has(id)).length;
}
