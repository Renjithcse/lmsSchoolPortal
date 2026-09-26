import { alpha } from '@mui/material/styles';

export const getAuthLayoutTokens = (theme, themeColors) => {
    const isDarkMode = theme.palette.mode === 'dark';

    const pageBackground = isDarkMode
        ? `linear-gradient(135deg, ${alpha(themeColors.background.primary, 0.98)} 0%, ${alpha(themeColors.background.secondary, 0.98)} 100%)`
        : `linear-gradient(135deg, ${alpha(themeColors.primary, 0.1)} 0%, ${alpha(themeColors.accent, 0.12)} 100%)`;

    const pageOverlay = isDarkMode
        ? `radial-gradient(circle at 20% 20%, ${alpha(themeColors.primary, 0.28)} 0%, transparent 45%),
           radial-gradient(circle at 80% 30%, ${alpha(themeColors.accent, 0.24)} 0%, transparent 45%),
           radial-gradient(circle at 50% 80%, ${alpha(themeColors.primary, 0.18)} 0%, transparent 60%)`
        : `radial-gradient(circle at 20% 20%, ${alpha(themeColors.primary, 0.12)} 0%, transparent 45%),
           radial-gradient(circle at 80% 30%, ${alpha(themeColors.accent, 0.12)} 0%, transparent 45%),
           radial-gradient(circle at 50% 80%, ${alpha(themeColors.primary, 0.08)} 0%, transparent 55%)`;

    const heroCardBackground = isDarkMode
        ? `linear-gradient(135deg, ${alpha(themeColors.primary, 0.9)} 0%, ${alpha(themeColors.accent, 0.85)} 100%)`
        : `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`;

    const heroOverlayOpacity = isDarkMode ? 0.1 : 0.15;
    const heroChipBackground = alpha('#ffffff', isDarkMode ? 0.12 : 0.15);
    const heroChipColor = '#ffffff';
    const heroAvatarBackground = alpha('#ffffff', isDarkMode ? 0.2 : 0.18);

    const formCardBackground = isDarkMode
        ? alpha(themeColors.background.secondary, 0.92)
        : themeColors.background.primary;
    const formCardBorderColor = isDarkMode
        ? alpha('#ffffff', 0.08)
        : themeColors.border.primary;
    const formCardShadow = isDarkMode
        ? `0 25px 60px -25px ${alpha('#000000', 0.75)}`
        : `0 25px 60px -25px ${alpha(themeColors.primary, 0.25)}`;
    const formOverlayBackground = isDarkMode
        ? `radial-gradient(circle at 20% 0%, ${alpha(themeColors.primary, 0.25)} 0%, transparent 45%),
           radial-gradient(circle at 80% 100%, ${alpha(themeColors.accent, 0.2)} 0%, transparent 45%)`
        : `radial-gradient(circle at 20% 0%, ${alpha(themeColors.primary, 0.08)} 0%, transparent 45%),
           radial-gradient(circle at 80% 100%, ${alpha(themeColors.accent, 0.1)} 0%, transparent 45%)`;
    const formOverlayOpacity = isDarkMode ? 0.32 : 0.6;

    const text = {
        heroSubtitle: alpha('#ffffff', isDarkMode ? 0.85 : 0.9),
        heroMuted: alpha('#ffffff', isDarkMode ? 0.8 : 0.85),
        formHeading: isDarkMode ? alpha('#ffffff', 0.92) : themeColors.text.primary,
        formBody: isDarkMode ? alpha('#ffffff', 0.78) : themeColors.text.secondary,
        formMuted: isDarkMode ? alpha('#ffffff', 0.65) : themeColors.text.secondary,
    };

    return {
        isDarkMode,
        pageBackground,
        pageOverlay,
        hero: {
            background: heroCardBackground,
            overlayOpacity: heroOverlayOpacity,
            chipBackground: heroChipBackground,
            chipColor: heroChipColor,
            avatarBackground: heroAvatarBackground,
        },
        form: {
            background: formCardBackground,
            borderColor: formCardBorderColor,
            boxShadow: formCardShadow,
            overlayBackground: formOverlayBackground,
            overlayOpacity: formOverlayOpacity,
        },
        text,
    };
};
