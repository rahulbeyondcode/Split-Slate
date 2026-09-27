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
    icon: "🔒",
    animatedIcon: lockAnimation,
    title: "No Account Needed",
    description: "Zero sign-up, zero servers. Your data lives on your device and nowhere else.",
  },
  {
    icon: "✂️",
    animatedIcon: scissorsAnimation,
    title: "Split Any Way You Like",
    description:
      "Equal, by exact amount, by shares, by percentage, or custom adjustments — you decide how it splits.",
  },
  {
    icon: "✈️",
    animatedIcon: airplaneAnimation,
    title: "Works Offline, Always",
    description:
      "No internet required. Add expenses on a flight, in the mountains, wherever you are.",
  },
  {
    icon: "📚",
    animatedIcon: booksAnimation,
    title: "Your Full History, Always",
    description:
      "Every expense, filter, and export available from day one. No artificial limits on what you can access.",
  },
  {
    icon: "🤝",
    animatedIcon: handshakeAnimation,
    title: "Multi-Payer, No Hassle",
    description:
      "One expense, multiple payers. Split the bill exactly the way it actually happened.",
  },
];
