import { useLayoutEffect, useRef } from "react";

import CategoryManagement from "@/features/group-detail/components/category-management";
import TagManagement from "@/features/group-detail/components/tag-management";

import { useViewport } from "@/shared/hooks/use-viewport";

const CategoriesAndTags = () => {
  const { isMobile } = useViewport();
  const managementRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const management = managementRef.current;
    const groupHeader = management
      ?.closest(".group-page")
      ?.querySelector<HTMLElement>(".group-page-header");
    if (!isMobile || !management || !groupHeader) return;

    const updateOffset = () => {
      management.style.setProperty(
        "--management-group-header-height",
        `${groupHeader.offsetHeight}px`,
      );
    };
    const observer = new ResizeObserver(updateOffset);
    observer.observe(groupHeader);
    updateOffset();
    return () => {
      observer.disconnect();
      management.style.removeProperty("--management-group-header-height");
    };
  }, [isMobile]);

  return (
    <section ref={managementRef} className="group-management flex flex-col gap-5">
      <h2 className="section-title">Categories & Tags</h2>
      <div className="group-management-grid responsive-grid items-start">
        <CategoryManagement />
        <TagManagement />
      </div>
    </section>
  );
};

export default CategoriesAndTags;
