import airplaneAnimation from "@/assets/images/noto-airplane.webp";
import booksAnimation from "@/assets/images/noto-books.webp";
import handshakeAnimation from "@/assets/images/noto-handshake.webp";
import lockAnimation from "@/assets/images/noto-lock.webp";
import scissorsAnimation from "@/assets/images/noto-scissors.webp";

export interface Slide {
  icon: string;
  animatedIcon: string;
  title: string;
  description: string;
}

export const slides: Slide[] = [
  {
    icon: "objects/locked-3d.png",
    animatedIcon: lockAnimation,
    title: "No Account Needed",
    description: "Zero sign-up, zero servers. Your data lives on your device and nowhere else.",
  },
  {
    icon: "objects/scissors-3d.png",
    animatedIcon: scissorsAnimation,
    title: "Split Any Way You Like",
    description:
      "Equal, by exact amount, by shares, by percentage, or custom adjustments — you decide how it splits.",
  },
  {
    icon: "travel-and-places/airplane-3d.png",
    animatedIcon: airplaneAnimation,
    title: "Works Offline, Always",
    description:
      "No internet required. Add expenses on a flight, in the mountains, wherever you are.",
  },
  {
    icon: "objects/books-3d.png",
    animatedIcon: booksAnimation,
    title: "Your Full History, Always",
    description:
      "Every expense, filter, and export available from day one. No artificial limits on what you can access.",
  },
  {
    icon: "activities/party-popper-3d.png",
    animatedIcon: handshakeAnimation,
    title: "Multi-Payer, No Hassle",
    description:
      "One expense, multiple payers. Split the bill exactly the way it actually happened.",
  },
];
