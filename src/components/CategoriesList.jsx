import { useCallback, useEffect, useState, memo } from "react";
import supabase from "../utils/supabase";

import AddCategory from "./AddCategory";
import CategoryItem from "./CategoryItem";

const CategoriesList = ({ refresh }) => {
  const [categories, setCategories] = useState([]);

  const getCategories = useCallback(async () => {
    const { data } = await supabase.from("categories").select("*");
    setCategories(data || []);
    refresh?.();
  }, [refresh]);

  useEffect(() => {
    getCategories();
  }, [getCategories]);

  return (
  <div className="categories-container">

    {/* ADD CATEGORY */}
    <AddCategory refresh={getCategories} />

    {/* CATEGORY LIST */}
    <div className="categories">
      {categories.map((cat) => (
        <CategoryItem
          key={cat.id}
          category={cat}
          refresh={getCategories}
        />
      ))}
    </div>

  </div>
);
};

export default memo(CategoriesList);
