import { Link } from "react-router-dom";

import { formatCurrency } from "@/shared/utils/currency";

import EmojiImage from "@/shared/ui/emoji-image";

interface SpendingCategory {
  name: string;
  icon: string;
  amount: number;
  to?: string;
}

interface PropsType {
  categories: SpendingCategory[];
  currency: string;
  totalAmount: number;
}

const CategorySpendingList = ({ categories, currency, totalAmount }: PropsType) => (
  <ol className="category-spending-list" aria-label="Category spending breakdown">
    {categories.map((category) => {
      const percentage = totalAmount > 0 ? (category.amount / totalAmount) * 100 : 0;
      const share = percentage > 0 && percentage < 0.1 ? "<0.1%" : `${percentage.toFixed(1)}%`;
      const content = (
        <>
          <span className="category-spending-identity">
            <EmojiImage icon={category.icon} className="!h-5 !w-5 shrink-0" />
            <span className="category-spending-name" title={category.name}>
              {category.name}
            </span>
          </span>
          <span className="category-spending-figures">
            <span className="category-spending-amount money">
              {formatCurrency(category.amount, currency)}
            </span>
            <span className="category-spending-share tabular">{share}</span>
          </span>
          <span className="category-spending-track" aria-hidden="true">
            <span className="category-spending-fill" style={{ width: `${percentage}%` }} />
          </span>
        </>
      );

      return (
        <li key={category.name} className="category-spending-item">
          {category.to ? (
            <Link to={category.to} className="category-spending-row">
              {content}
            </Link>
          ) : (
            <div className="category-spending-row">{content}</div>
          )}
        </li>
      );
    })}
  </ol>
);

export default CategorySpendingList;
