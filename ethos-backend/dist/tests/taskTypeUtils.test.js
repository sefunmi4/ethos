"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const taskTypeUtils_1 = require("../src/utils/taskTypeUtils");
describe('taskTypeUtils', () => {
    test('convertFileToFolder creates child file and rewires edges', () => {
        const post = {
            id: 't1',
            authorId: 'u1',
            type: 'task',
            content: 'File',
            visibility: 'public',
            timestamp: '',
            tags: [],
            collaborators: [],
            linkedItems: [],
            questId: 'q1',
            taskType: 'file'
        };
        const child = {
            id: 'c1',
            authorId: 'u1',
            type: 'task',
            content: 'child',
            visibility: 'public',
            timestamp: '',
            tags: [],
            collaborators: [],
            linkedItems: [],
            questId: 'q1',
            taskType: 'abstract'
        };
        const posts = [post, child];
        const quest = {
            id: 'q1',
            authorId: 'u1',
            title: 'Q',
            visibility: 'public',
            approvalStatus: 'approved',
            status: 'active',
            headPostId: '',
            linkedPosts: [],
            collaborators: [],
            taskGraph: [{ from: 't1', to: 'c1' }]
        };
        const fileNode = (0, taskTypeUtils_1.convertFileToFolder)(post, posts, quest);
        expect(post.taskType).toBe('folder');
        expect(fileNode.taskType).toBe('file');
        expect(posts).toContain(fileNode);
        expect(quest.taskGraph.some(e => e.from === fileNode.id && e.to === 'c1')).toBe(true);
        expect(quest.taskGraph.some(e => e.from === 't1' && e.to === fileNode.id)).toBe(true);
    });
    test('convertFolderToFile merges child file', () => {
        const folder = {
            id: 't1',
            authorId: 'u1',
            type: 'task',
            content: '',
            visibility: 'public',
            timestamp: '',
            tags: [],
            collaborators: [],
            linkedItems: [],
            questId: 'q1',
            taskType: 'folder'
        };
        const file = {
            id: 'f1',
            authorId: 'u1',
            type: 'task',
            content: '',
            visibility: 'public',
            timestamp: '',
            tags: [],
            collaborators: [],
            linkedItems: [],
            questId: 'q1',
            taskType: 'file'
        };
        const sub = {
            id: 'c1',
            authorId: 'u1',
            type: 'task',
            content: '',
            visibility: 'public',
            timestamp: '',
            tags: [],
            collaborators: [],
            linkedItems: [],
            questId: 'q1',
            taskType: 'abstract'
        };
        const posts = [folder, file, sub];
        const quest = {
            id: 'q1',
            authorId: 'u1',
            title: '',
            visibility: 'public',
            approvalStatus: 'approved',
            status: 'active',
            headPostId: '',
            linkedPosts: [],
            collaborators: [],
            taskGraph: [
                { from: 't1', to: 'f1', type: 'folder_split' },
                { from: 'f1', to: 'c1' }
            ]
        };
        (0, taskTypeUtils_1.convertFolderToFile)(folder, posts, quest);
        expect(folder.taskType).toBe('file');
        expect(posts.find(p => p.id === 'f1')).toBeUndefined();
        expect(quest.taskGraph.some(e => e.from === folder.id && e.to === 'c1')).toBe(true);
        expect(quest.taskGraph.some(e => e.to === 'f1')).toBe(false);
    });
});
