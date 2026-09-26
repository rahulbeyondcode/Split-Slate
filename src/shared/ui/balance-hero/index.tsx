import type { ReactNode } from "react";

interface PropsType {
  label: string;
  amount?: ReactNode;
  description: string;
  extra?: ReactNode;
}

const BalanceHero = ({ label, amount, description, extra }: PropsType) => (
  <section className="hero">
    <div className="relative z-1 flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="hero-label">{label}</p>
        {amount && <p className="hero-number mt-2">{amount}</p>}
        <p className="mt-2 text-xs font-semibold text-white/85">{description}</p>
      </div>
      {extra && <div className="flex gap-2">{extra}</div>}
    </div>
  </section>
);

export default BalanceHero;
