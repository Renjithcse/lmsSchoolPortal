export const TYPOGRAPHY_Style = (fontFamily) => {
    return {
        large: {
            fontSize: { xl: 30, lg: 26, md: 20, sm: 18, xs: 16 },
            fontFamily: fontFamily || 'Outfit-Bold',
            letterSpacing: 1,
        },
        medium: {
            fontSize: { xl: 26, lg: 22, md: 20, sm: 17, xs: 15 },
            fontFamily: fontFamily || 'Outfit-Medium',
            letterSpacing: 1,
        },
        small: {
            fontSize: { xl: 22, lg: 20, md: 18, sm: 16, xs: 14 },
            fontFamily: fontFamily || 'Outfit-Regular'
        },
        extraSmall: {
            fontSize: { xl: 20, lg: 18, md: 16, sm: 14, xs: 14 },
            fontFamily: fontFamily || 'Outfit-Light'
        },
    }
};
