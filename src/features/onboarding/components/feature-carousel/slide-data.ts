export interface Slide {
  icon: string
  title: string
  description: string
}

export const slides: Slide[] = [
  {
    icon: '🔒',
    title: 'No Account Needed',
    description:
      'Zero sign-up, zero servers. Your data lives on your device and nowhere else.',
  },
  {
    icon: '✂️',
    title: 'Split Any Way You Like',
    description:
      'Equal, by exact amount, by shares, by percentage, or custom adjustments — you decide how it splits.',
  },
  {
    icon: '📡',
    title: 'Works Offline, Always',
    description:
      'No internet required. Add expenses on a flight, in the mountains, wherever you are.',
  },
  {
    icon: '📚',
    title: 'Your Full History, Always',
    description:
      'Every expense, filter, and export available from day one. No artificial limits on what you can access.',
  },
  {
    icon: '👥',
    title: 'Multi-Payer, No Hassle',
    description:
      'One expense, multiple payers. Split the bill exactly the way it actually happened.',
  },
]
