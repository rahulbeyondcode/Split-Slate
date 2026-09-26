import CategoryManagement from "@/features/group-detail/components/category-management";
import TagManagement from "@/features/group-detail/components/tag-management";

const CategoriesAndTags = () => (
  <section className="responsive-grid items-start">
    <CategoryManagement />
    <TagManagement />
  </section>
);

export default CategoriesAndTags;
