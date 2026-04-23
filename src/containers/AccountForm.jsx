import { memo } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

const validationSchema = yup.object({
  name: yup.string("Enter your name").required("Name is required"),
  email: yup.string("Enter your email").email("Enter a valid email").required("Email is required"),
  password: yup.string("Enter your password").min(8, "Password should be of minimum 8 characters length").required("Password is required"),
});

const fieldSx = {
  "& .MuiInputBase-input": {
    fontSize: 15,
  },
};

const AccountForm = ({ onSubmit }) => {
  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      await onSubmit(values.name, values.email, values.password);
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: "grid", gap: 2.25 }}>
      <TextField
        fullWidth
        id="name"
        name="name"
        label="Name"
        value={formik.values.name}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.name && Boolean(formik.errors.name)}
        helperText={formik.touched.name && formik.errors.name}
        sx={fieldSx}
      />

      <TextField
        fullWidth
        id="email"
        name="email"
        label="Email"
        value={formik.values.email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.email && Boolean(formik.errors.email)}
        helperText={formik.touched.email && formik.errors.email}
        sx={fieldSx}
      />

      <TextField
        fullWidth
        id="password"
        name="password"
        label="Password"
        type="password"
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.password && Boolean(formik.errors.password)}
        helperText={formik.touched.password && formik.errors.password}
        sx={fieldSx}
      />

      <Button color="secondary" variant="contained" fullWidth type="submit" size="large">
        Continue
      </Button>
    </Box>
  );
};

export default memo(AccountForm);
