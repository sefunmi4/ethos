// Utility functions for board logic like sorting, filtering, grouping, and status formatting

export const sortByPriority = (items) => {
    return [...items].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  };
  
  export const groupByStatus = (items) => {
    const groups = {};
    for (const item of items) {
      const status = item.status || 'unsorted';
      if (!groups[status]) groups[status] = [];
      groups[status].push(item);
    }
    return groups;
  };
  
  export const filterBySearch = (items, query) => {
    if (!query) return items;
    return items.filter((item) =>
      item.title?.toLowerCase().includes(query.toLowerCase())
    );
  };
  
  export const filterByType = (items, type) => {
    if (!type) return items;
    return items.filter((item) => item.type === type);
  };
  
  export const applyBoardFilters = (items, filters = {}) => {
    let filtered = [...items];
    if (filters.type) {
      filtered = filterByType(filtered, filters.type);
    }
    if (filters.search) {
      filtered = filterBySearch(filtered, filters.search);
    }
    return filtered;
  };
  