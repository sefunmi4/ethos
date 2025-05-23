import QuestList from './QuestList';
import QuestTree from './QuestTree';
import QuestGrid from './QuestGrid';
import QuestGraph from './QuestGraph';

const questStructureComponents = {
  list: QuestList,
  tree: QuestTree,
  grid: QuestGrid,
  graph: QuestGraph,
  default: QuestList,
};

export default questStructureComponents;