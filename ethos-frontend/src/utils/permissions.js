export const Roles = {
    EXPLORER: 'explorer',
    ADVENTURER: 'adventurer',
    ADMIN: 'admin',
  };
  
  export const Permissions = {
    CREATE_PROJECT: ['adventurer', 'admin'],
    DELETE_PROJECT: ['admin'],
    VIEW_PROFILE: ['adventurer', 'admin'],
  };