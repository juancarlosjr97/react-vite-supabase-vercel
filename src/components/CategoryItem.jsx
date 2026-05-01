import { memo } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import toast from "react-hot-toast";
import supabase from "../utils/supabase";
import { getCategoryMeta } from "../utils/categoryIcons";

const CategoryItem = ({ category, refresh }) => {
  const { icon: Icon, color } = getCategoryMeta(category.name);

  const deleteCategory = async () => {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Deleted");
      refresh();
    }
  };

  return (
    <div className="category-item">
      <Icon style={{ fontSize: 18, color, flexShrink: 0 }} />
      <span>{category.name}</span>

      {!category.is_default && (
        <button className="delete-btn" onClick={deleteCategory}>
          <DeleteIcon fontSize="small" />
        </button>
      )}
    </div>
  );
};

export default memo(CategoryItem);