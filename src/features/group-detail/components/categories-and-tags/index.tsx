import CategoryManagement from "@/features/group-detail/components/category-management";
import TagManagement from "@/features/group-detail/components/tag-management";

const CategoriesAndTags = () => (
  <section className="group-management flex flex-col gap-5">
    <div className="group-management-grid responsive-grid items-start">
      <CategoryManagement />
      <TagManagement />
    </div>
  </section>
);

export default CategoriesAndTags;
