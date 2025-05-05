// src/api/problems.js
import axios from 'axios';

export default {
    getProblems: async () => {
      const res = await axios.get('/api/problems');
      return res.data;
    }
  };