import type { CSSProperties } from "react";

/**
 * Material Symbols (Rounded) icon adapter.
 *
 * Renders Google's Material Symbols icon font. Components keep the same
 * lucide-style API (`<Home size={18} />`) so usage didn't have to change
 * during the migration — only the import source did.
 *
 * The base `<Icon name="..." />` takes a Material Symbols glyph name directly;
 * the named exports below map the project's previous lucide icon names to the
 * closest Material Symbol.
 */

export type IconProps = {
  /** Material Symbols glyph name, e.g. "home", "calendar_month". */
  name: string;
  /** Pixel size (sets both font-size and optical size). Default 20. */
  size?: number;
  /** Filled vs. outlined variant. Default false (outlined). */
  fill?: boolean;
  /** Stroke weight 100–700. Default 400. */
  weight?: number;
  className?: string;
  style?: CSSProperties;
  "aria-hidden"?: boolean;
  "aria-label"?: string;
};

export function Icon({
  name,
  size = 20,
  fill = false,
  weight = 400,
  className,
  style,
  "aria-hidden": ariaHidden = true,
  "aria-label": ariaLabel
}: IconProps) {
  return (
    <span
      className={`material-symbols-rounded${className ? ` ${className}` : ""}`}
      aria-hidden={ariaLabel ? undefined : ariaHidden}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
      style={{
        fontSize: size,
        fontFeatureSettings: "'liga'",
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
        ...style
      }}
    >
      {name}
    </span>
  );
}

/**
 * Type for an icon component (drop-in replacement for lucide's `LucideIcon`).
 * Kept under the same name so existing `NavItem`/prop types still compile.
 */
export type LucideIcon = (props: Omit<IconProps, "name">) => React.JSX.Element;

/** Build a named-export icon component bound to a Material Symbols glyph. */
function glyph(name: string) {
  const Comp = (props: Omit<IconProps, "name">) => <Icon name={name} {...props} />;
  Comp.displayName = `Icon(${name})`;
  return Comp;
}

/* ===== lucide-react name → Material Symbols glyph map =====
   Keeps existing JSX (<Home size={18} />) working after swapping imports. */
export const ArrowLeft = glyph("arrow_back");
export const ArrowRight = glyph("arrow_forward");
export const BadgeCheck = glyph("verified");
export const Bell = glyph("notifications");
export const Bot = glyph("smart_toy");
export const Calendar = glyph("calendar_month");
export const CalendarDays = glyph("calendar_month");
export const Camera = glyph("photo_camera");
export const Check = glyph("check");
export const CheckCircle2 = glyph("check_circle");
export const ChevronDown = glyph("expand_more");
export const ChevronLeft = glyph("chevron_left");
export const ChevronRight = glyph("chevron_right");
export const Clock = glyph("schedule");
export const Clock3 = glyph("schedule");
export const Coins = glyph("paid");
export const Copy = glyph("content_copy");
export const Download = glyph("download");
export const Eye = glyph("visibility");
export const EyeOff = glyph("visibility_off");
export const FileBadge = glyph("workspace_premium");
export const FileSpreadsheet = glyph("table_view");
export const FileText = glyph("description");
export const FileUp = glyph("upload_file");
export const HeartPulse = glyph("cardiology");
export const Home = glyph("home");
export const Inbox = glyph("inbox");
export const Info = glyph("info");
export const Landmark = glyph("account_balance");
export const LayoutDashboard = glyph("dashboard");
export const LogIn = glyph("login");
export const LogOut = glyph("logout");
export const MapPin = glyph("location_on");
export const Megaphone = glyph("campaign");
export const Menu = glyph("menu");
export const Paperclip = glyph("attach_file");
export const Pencil = glyph("edit");
export const PiggyBank = glyph("savings");
export const Pin = glyph("keep");
export const Plus = glyph("add");
export const PlusCircle = glyph("add_circle");
export const RotateCcw = glyph("undo");
export const ScrollText = glyph("history_edu");
export const Send = glyph("send");
export const Settings = glyph("settings");
export const Settings2 = glyph("tune");
export const Shield = glyph("shield");
export const ShieldAlert = glyph("gpp_maybe");
export const ShieldCheck = glyph("verified_user");
export const ShieldOff = glyph("gpp_bad");
export const Trash2 = glyph("delete");
export const Upload = glyph("upload");
export const User = glyph("person");
export const UserPlus = glyph("person_add");
export const UserRound = glyph("person");
export const Users = glyph("group");
export const UsersRound = glyph("groups");
export const Wrench = glyph("build");
export const X = glyph("close");
export const XCircle = glyph("cancel");
