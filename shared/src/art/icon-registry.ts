import { APPLE_ICON } from "./icon-apple";
import { BALL_ICON } from "./icon-ball";
import { BANANA_ICON } from "./icon-banana";
import { BEAR_ICON } from "./icon-bear";
import { BIRD_ICON } from "./icon-bird";
import { BOAT_ICON } from "./icon-boat";
import { BOOK_ICON } from "./icon-book";
import { BUS_ICON } from "./icon-bus";
import { BUTTERFLY_ICON } from "./icon-butterfly";
import { CAKE_ICON } from "./icon-cake";
import { CAR_ICON } from "./icon-car";
import { CAT_ICON } from "./icon-cat";
import { CLOCK_ICON } from "./icon-clock";
import { CLOUD_ICON } from "./icon-cloud";
import { CUP_ICON } from "./icon-cup";
import { DOG_ICON } from "./icon-dog";
import { DRUM_ICON } from "./icon-drum";
import { EGG_ICON } from "./icon-egg";
import { FISH_ICON } from "./icon-fish";
import { FLOWER_ICON } from "./icon-flower";
import { FROG_ICON } from "./icon-frog";
import { HAT_ICON } from "./icon-hat";
import { HEART_ICON } from "./icon-heart";
import { HOUSE_ICON } from "./icon-house";
import type { IconId } from "./icon-ids";
import { KEY_ICON } from "./icon-key";
import { KITE_ICON } from "./icon-kite";
import { LEAF_ICON } from "./icon-leaf";
import { MILK_ICON } from "./icon-milk";
import { MOON_ICON } from "./icon-moon";
import { PENCIL_ICON } from "./icon-pencil";
import { PLANE_ICON } from "./icon-plane";
import { RABBIT_ICON } from "./icon-rabbit";
import { RAIN_ICON } from "./icon-rain";
import { ROCKET_ICON } from "./icon-rocket";
import { SHOE_ICON } from "./icon-shoe";
import { STAR_ICON } from "./icon-star";
import { SUN_ICON } from "./icon-sun";
import { TRAIN_ICON } from "./icon-train";
import { TREE_ICON } from "./icon-tree";
import { UMBRELLA_ICON } from "./icon-umbrella";

// Record<IconId, string> makes a missing or extra icon a compile error, so ids and SVGs cannot drift.
export const ICONS: Record<IconId, string> = {
  ball: BALL_ICON,
  bear: BEAR_ICON,
  cat: CAT_ICON,
  dog: DOG_ICON,
  bus: BUS_ICON,
  car: CAR_ICON,
  apple: APPLE_ICON,
  banana: BANANA_ICON,
  sun: SUN_ICON,
  moon: MOON_ICON,
  star: STAR_ICON,
  tree: TREE_ICON,
  flower: FLOWER_ICON,
  fish: FISH_ICON,
  bird: BIRD_ICON,
  house: HOUSE_ICON,
  book: BOOK_ICON,
  pencil: PENCIL_ICON,
  cloud: CLOUD_ICON,
  rain: RAIN_ICON,
  heart: HEART_ICON,
  boat: BOAT_ICON,
  train: TRAIN_ICON,
  plane: PLANE_ICON,
  cake: CAKE_ICON,
  milk: MILK_ICON,
  egg: EGG_ICON,
  hat: HAT_ICON,
  shoe: SHOE_ICON,
  clock: CLOCK_ICON,
  key: KEY_ICON,
  cup: CUP_ICON,
  leaf: LEAF_ICON,
  rabbit: RABBIT_ICON,
  frog: FROG_ICON,
  butterfly: BUTTERFLY_ICON,
  rocket: ROCKET_ICON,
  umbrella: UMBRELLA_ICON,
  drum: DRUM_ICON,
  kite: KITE_ICON,
};

// Only registry constants are ever returned, never a model string.
export const renderIcon = (id: IconId): string => ICONS[id];
