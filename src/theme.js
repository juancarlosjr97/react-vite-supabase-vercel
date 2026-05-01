import { createTheme } from "@mui/material/styles";

const palettes = {
  light: {
    background: "#f1eadc",
    backgroundAlt: "#e6d7c1",
    surface: "#fbf5ea",
    surfaceStrong: "#efe1cb",
    primary: "#181512",
    secondary: "#6d6257",
    accent: "#b25539",
    accentDeep: "#2d5b53",
    border: "#211b17",
    borderSoft: "rgba(33, 27, 23, 0.16)",
    success: "#48694f",
    warning: "#ad722f",
    error: "#a0412f",
    bodyTint:
      "radial-gradient(circle at top left, rgba(178,85,57,0.2), transparent 28%), radial-gradient(circle at 88% 12%, rgba(45,91,83,0.12), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.46), rgba(255,255,255,0.04))",
  },
  dark: {
    background: "#15110f",
    backgroundAlt: "#221a16",
    surface: "#1d1713",
    surfaceStrong: "#2a211c",
    primary: "#f3e8d5",
    secondary: "#b4a692",
    accent: "#d07a57",
    accentDeep: "#7ea297",
    border: "#f3e8d5",
    borderSoft: "rgba(243, 232, 213, 0.18)",
    success: "#7da784",
    warning: "#d09a4f",
    error: "#cc6d59",
    bodyTint:
      "radial-gradient(circle at top left, rgba(208,122,87,0.18), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0))",
  },
};

export function getAppTheme(mode = "light") {
  const palette = palettes[mode] || palettes.light;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: palette.primary,
        contrastText: palette.surface,
      },
      secondary: {
        main: palette.accent,
        contrastText: palette.surface,
      },
      background: {
        default: palette.background,
        paper: palette.surface,
      },
      text: {
        primary: palette.primary,
        secondary: palette.secondary,
      },
      success: { main: palette.success },
      warning: { main: palette.warning },
      error: { main: palette.error },
      divider: palette.borderSoft,
    },
    shape: {
      borderRadius: 14,
    },
    typography: {
      fontFamily: '"Instrument Sans", sans-serif',
      h1: {
        fontFamily: '"Cormorant Garamond", serif',
        fontWeight: 600,
        letterSpacing: "-0.03em",
      },
      h2: {
        fontFamily: '"Cormorant Garamond", serif',
        fontWeight: 600,
        letterSpacing: "-0.03em",
      },
      h3: {
        fontFamily: '"Cormorant Garamond", serif',
        fontWeight: 600,
        letterSpacing: "-0.02em",
      },
      h4: {
        fontFamily: '"Cormorant Garamond", serif',
        fontWeight: 600,
      },
      button: {
        fontFamily: '"Instrument Sans", sans-serif',
        fontWeight: 600,
        textTransform: "none",
        letterSpacing: "0.01em",
      },
      caption: {
        fontFamily: '"IBM Plex Mono", monospace',
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ":root": {
            colorScheme: mode,
          },
          body: {
            backgroundColor: palette.background,
            backgroundImage: palette.bodyTint,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: "transparent",
            color: palette.primary,
            border: "none",
            backdropFilter: "none",
            boxShadow: "none",
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 999,
            paddingInline: 18,
            paddingBlock: 10,
            border: `1px solid ${mode === "light" ? palette.border : palette.borderSoft}`,
          },
          contained: {
            background: palette.primary,
            color: palette.surface,
            boxShadow: `4px 4px 0 ${mode === "light" ? palette.border : "rgba(0,0,0,0.32)"}`,
            "&:hover": {
              background: palette.accent,
              boxShadow: `6px 6px 0 ${mode === "light" ? palette.border : "rgba(0,0,0,0.4)"}`,
              transform: "translate(-1px, -1px)",
            },
          },
          outlined: {
            background: palette.surface,
            color: palette.primary,
            borderColor: mode === "light" ? palette.border : palette.borderSoft,
            boxShadow: `3px 3px 0 ${palette.borderSoft}`,
            "&:hover": {
              background: palette.surfaceStrong,
              borderColor: mode === "light" ? palette.border : palette.primary,
            },
          },
          text: {
            border: "none",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: palette.surface,
            border: `1px solid ${palette.borderSoft}`,
            boxShadow: `6px 6px 0 ${palette.borderSoft}`,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: palette.surface,
            borderRadius: 14,
            fontFamily: '"Instrument Sans", sans-serif',
            "& fieldset": {
              borderColor: palette.borderSoft,
            },
            "&:hover fieldset": {
              borderColor: mode === "light" ? palette.border : palette.primary,
            },
            "&.Mui-focused fieldset": {
              borderColor: palette.accent,
              borderWidth: 1,
            },
          },
          input: {
            color: palette.primary,
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: palette.secondary,
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            color: palette.secondary,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontFamily: '"Instrument Sans", sans-serif',
            "&:hover": {
              backgroundColor: palette.surfaceStrong,
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            border: `1px solid ${palette.borderSoft}`,
          },
        },
      },
    },
  });
}

export default getAppTheme;
