import { memo } from "react";
import { useFormik } from "formik";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import toast from "react-hot-toast";
import supabase from "../utils/supabase";

const AddCategory = ({ refresh }) => {
  const formik = useFormik({
    initialValues: {
      name: "",
    },
    onSubmit: async (values, { resetForm }) => {
      const name = values.name.trim();
      if (!name) {
        toast.error("Enter a category name");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not logged in");
        return;
      }

      const { error } = await supabase.from("categories").insert([{ 
        name,
        is_default: false,
        user_id: user.id
      }]);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Category added");
        resetForm();
        if (refresh) refresh();
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <Stack spacing={2} sx={{ marginBottom: 1.5 }}>
        <TextField
          fullWidth
          id="name"
          name="name"
          label="Category Name"
          value={formik.values.name}
          onChange={formik.handleChange}
        />

        <Button variant="contained" color="secondary" fullWidth type="submit">
          Add Category
        </Button>
      </Stack>
    </form>
  );
};

export default memo(AddCategory);
