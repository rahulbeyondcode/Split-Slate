import CategoryManagement from "@/features/group-detail/components/category-management";
import TagManagement from "@/features/group-detail/components/tag-management";

const CategoriesAndTags = () => (
  <section className="flex flex-col gap-8">
    <h2 className="text-lg font-semibold text-gray-900">Categories & Tags</h2>
    <CategoryManagement />
    <TagManagement />
  </section>
);

export default CategoriesAndTags;
