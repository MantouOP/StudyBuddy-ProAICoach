export const getBorderClass = (hexColor) => {
    if (!hexColor) return '';

    const borderMap = {
        '#57534e': 'dungeon-border-iron',
        '#cbd5e1': 'dungeon-border-silver',
        '#fbbf24': 'dungeon-border-gold',
        '#2dd4bf': 'dungeon-border-platinum',
        '#38bdf8': 'dungeon-border-diamond',
        '#e11d48': 'dungeon-border-immortal',
        '#fef08a': 'dungeon-border-radiant',
        '#c084fc': 'dungeon-border-transcendent'
    };

    return borderMap[hexColor.toLowerCase()] || '';
};
