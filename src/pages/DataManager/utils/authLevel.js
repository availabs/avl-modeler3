export const authLevelConverter = (authLevel) => {
    const authLevels = {
        'Guest User' : -1,
        'Public User': 0,
        'Agency User': 1
    }

    return authLevels[authLevel];
};

const baseUserViewAccess = (access) => {
    const accessKeys = Object.keys(access);

    let accessLevel = Number.MAX_SAFE_INTEGER;
    accessKeys.map((key) => {
        if(access[key].view == true) {
            accessLevel = Math.min(accessLevel, authLevelConverter(key));
        }
    });

    if(accessLevel == Number.MAX_SAFE_INTEGER) accessLevel = Number.MIN_SAFE_INTEGER
    return accessLevel;
}


export default baseUserViewAccess;