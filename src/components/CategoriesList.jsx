import { useEffect, useState, memo } from "react";
import Stack from "@mui/material/Stack";
import supabase from "../utils/supabase";

import AddCategory from "./AddCategory";
import CategoryItem from "./CategoryItem";

const CategoriesList = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories();
  }, []);

  const getCategories = async () => {
    const { data } = await supabase.from("categories").select("*");
    setCategories(data || []);
  };

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