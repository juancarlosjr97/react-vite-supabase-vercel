import RestaurantIcon from "@mui/icons-material/Restaurant";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import MovieIcon from "@mui/icons-material/Movie";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import HomeIcon from "@mui/icons-material/Home";
import ReceiptIcon from "@mui/icons-material/Receipt";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import SchoolIcon from "@mui/icons-material/School";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import FlightIcon from "@mui/icons-material/Flight";
import SavingsIcon from "@mui/icons-material/Savings";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import CardGiftcardRoundedIcon from "@mui/icons-material/CardGiftcardRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import PetsRoundedIcon from "@mui/icons-material/PetsRounded";
import ChildCareRoundedIcon from "@mui/icons-material/ChildCareRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";
import LocalFloristRoundedIcon from "@mui/icons-material/LocalFloristRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import LaptopRoundedIcon from "@mui/icons-material/LaptopRounded";
import SpaRoundedIcon from "@mui/icons-material/SpaRounded";
import FastfoodRoundedIcon from "@mui/icons-material/FastfoodRounded";
import DiamondRoundedIcon from "@mui/icons-material/DiamondRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import OutdoorGrillRoundedIcon from "@mui/icons-material/OutdoorGrillRounded";
import NightlifeRoundedIcon from "@mui/icons-material/NightlifeRounded";
import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import CasinoRoundedIcon from "@mui/icons-material/CasinoRounded";
import SportsBasketballRoundedIcon from "@mui/icons-material/SportsBasketballRounded";
import DinnerDiningRoundedIcon from "@mui/icons-material/DinnerDiningRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";

const ICON_MAP = [
  {
    keywords: ["food", "dining", "restaurant", "eat", "lunch", "dinner", "breakfast", "grocery", "groceries", "takeaway", "takeout"],
    icon: RestaurantIcon,
    color: "#f59e0b",
  },
  {
    keywords: ["transport", "travel", "car", "bus", "train", "taxi", "uber", "fuel", "petrol", "gas", "commute", "parking"],
    icon: DirectionsCarIcon,
    color: "#3b82f6",
  },
  {
    keywords: ["shopping", "clothes", "clothing", "fashion", "shop", "retail", "amazon"],
    icon: ShoppingBagIcon,
    color: "#ec4899",
  },
  {
    keywords: ["entertainment", "fun", "movie", "cinema", "game", "games", "leisure", "streaming", "netflix", "spotify"],
    icon: MovieIcon,
    color: "#8b5cf6",
  },
  {
    keywords: ["health", "medical", "doctor", "pharmacy", "hospital", "medicine", "dentist", "optician"],
    icon: LocalHospitalIcon,
    color: "#ef4444",
  },
  {
    keywords: ["home", "rent", "housing", "mortgage", "furniture", "household"],
    icon: HomeIcon,
    color: "#10b981",
  },
  {
    keywords: ["bills", "utilities", "electric", "electricity", "water", "internet", "phone", "broadband", "subscription"],
    icon: ReceiptIcon,
    color: "#f97316",
  },
  {
    keywords: ["coffee", "cafe", "café", "drink", "bar"],
    icon: LocalCafeIcon,
    color: "#92400e",
  },
  {
    keywords: ["education", "school", "course", "book", "books", "tuition", "university", "college"],
    icon: SchoolIcon,
    color: "#0ea5e9",
  },
  {
    keywords: ["gym", "fitness", "sport", "sports", "exercise", "yoga", "running"],
    icon: FitnessCenterIcon,
    color: "#84cc16",
  },
  {
    keywords: ["flight", "holiday", "vacation", "trip", "hotel", "airbnb", "accommodation"],
    icon: FlightIcon,
    color: "#06b6d4",
  },
  {
    keywords: ["savings", "investment", "pension", "saving"],
    icon: SavingsIcon,
    color: "#22c55e",
  },
];

const FALLBACK_POOL = [
  { icon: StarRoundedIcon,              color: "#c48a3a" },
  { icon: AttachMoneyRoundedIcon,       color: "#48694f" },
  { icon: CardGiftcardRoundedIcon,      color: "#b25539" },
  { icon: WorkRoundedIcon,              color: "#6d6257" },
  { icon: PetsRoundedIcon,              color: "#ad722f" },
  { icon: ChildCareRoundedIcon,         color: "#2d5b53" },
  { icon: MusicNoteRoundedIcon,         color: "#856149" },
  { icon: SportsEsportsRoundedIcon,     color: "#778e69" },
  { icon: LocalFloristRoundedIcon,      color: "#a0412f" },
  { icon: VolunteerActivismRoundedIcon, color: "#7ea297" },
  { icon: EmojiEventsRoundedIcon,       color: "#c48a3a" },
  { icon: LaptopRoundedIcon,            color: "#3b82f6" },
  { icon: SpaRoundedIcon,               color: "#ec4899" },
  { icon: FastfoodRoundedIcon,          color: "#f59e0b" },
  { icon: DiamondRoundedIcon,           color: "#8b5cf6" },
  { icon: RocketLaunchRoundedIcon,      color: "#06b6d4" },
  { icon: OutdoorGrillRoundedIcon,      color: "#f97316" },
  { icon: NightlifeRoundedIcon,         color: "#856149" },
  { icon: WaterDropRoundedIcon,         color: "#0ea5e9" },
  { icon: AutoAwesomeRoundedIcon,       color: "#d07a57" },
  { icon: CelebrationRoundedIcon,       color: "#b25539" },
  { icon: CasinoRoundedIcon,            color: "#48694f" },
  { icon: SportsBasketballRoundedIcon,  color: "#f97316" },
  { icon: DinnerDiningRoundedIcon,      color: "#92400e" },
  { icon: BuildRoundedIcon,             color: "#6d6257" },
];

function getFallback(name) {
  const hash = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return FALLBACK_POOL[hash % FALLBACK_POOL.length];
}

export function getCategoryMeta(name = "") {
  const lower = name.toLowerCase();
  return (
    ICON_MAP.find(({ keywords }) => keywords.some((kw) => lower.includes(kw))) ||
    getFallback(lower)
  );
}
